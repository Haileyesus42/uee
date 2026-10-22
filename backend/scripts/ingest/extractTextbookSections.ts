// Converts a manifest of {unitTitle, sectionTitle, pageStart, pageEnd} entries
// (see scripts/ingest/manifests/biology-g11.json) into a reviewable JSON file of
// TextbookSection rows — the raw, verbatim reading-mode content, as opposed to
// extractLessonFromText.ts's LLM-structured LessonStep content.
//
// No Groq call anywhere in this script: this is verbatim source text, not
// LLM-generated structure, so it doesn't touch the daily token cap that's
// blocked lesson-content extraction, and doesn't carry the same accuracy-risk
// that justifies the exam pipeline's heavy reviewed:true-per-item gate. Still
// written to a reviewable file first — spot-check for header/footer leakage or
// a garbled page — before importReviewed.ts --textbook writes it to Postgres.
//
// Real content figures (see imageExtract.ts — filters the book's decorative
// watermark tiles out by encoding/size) are extracted per page and interleaved
// right before the paragraph that captions them ("Figure 1.5 ..."), matched in
// reading order. Saved into assets/textbook-images/<subject>/, served by the
// backend's GET /textbook/images/:filename route.
//
// Structure (headings, lists, tables) comes from classifyBlocks.ts, which
// works off pdftotext -bbox-layout word/line geometry rather than plain text
// — see that file for why (bullet glyphs, multi-column reading order, and
// header/footer stripping all need real coordinates, not just text shape).
//
// Usage:
//   npm run ingest:textbook -- --manifest scripts/ingest/manifests/biology-g11.json
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pdfPageStructure } from './pdfStructure';
import { classifyPage, DocNode } from './classifyBlocks';
import { extractContentFigures, cleanupBookImages } from './imageExtract';
import { ExtractedContentBlock } from './schemas';

type ManifestSection = { unitTitle: string; sectionTitle: string; pageStart: number; pageEnd: number };
type Manifest = {
  subject: string;
  grade: number;
  // 'textbook' (default) for the student book, 'teacher_guide' for the
  // teacher's edition — same block shape, just a different source book and
  // TextbookSection.kind on import. See prisma/schema.prisma.
  kind?: 'textbook' | 'teacher_guide';
  pdfPath: string;
  knownHeaders?: string[];
  sections: ManifestSection[];
};

const FIGURE_CAPTION = /^Figure\s+\d+(\.\d+)*/i;

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!args.manifest) throw new Error('Usage: --manifest <path> [--out <path>]');
  return { manifest: args.manifest, out: args.out };
}

// Interleaves extracted images right before the paragraph that captions them,
// matched in reading order (images and captions appear in the same relative
// order on a textbook page) — not a precise per-figure match, but a reliable
// approximation for how this book is laid out. Any images left over once all
// captions are matched (a caption the heuristic missed, or a figure with no
// caption at all) are appended at the end rather than silently dropped.
// classifyBlocks.ts calls plain body text 'paragraph'; the stored schema
// calls the same shape 'text' (pre-existing naming, kept for backward
// compatibility with already-imported sections) — this is the one place that
// translation happens.
function toContentBlock(node: DocNode): ExtractedContentBlock {
  return node.type === 'paragraph' ? { type: 'text', text: node.text } : node;
}

function buildBlocks(
  nodes: DocNode[],
  images: { filename: string; width: number; height: number }[]
): ExtractedContentBlock[] {
  const blocks: ExtractedContentBlock[] = [];
  let imgIndex = 0;
  for (const node of nodes) {
    const isCaption = node.type === 'paragraph' && FIGURE_CAPTION.test(node.text.trim());
    if (isCaption && imgIndex < images.length) {
      const img = images[imgIndex];
      imgIndex += 1;
      blocks.push({ type: 'image', filename: img.filename, width: img.width, height: img.height, caption: node.text });
    } else {
      blocks.push(toContentBlock(node));
    }
  }
  for (; imgIndex < images.length; imgIndex += 1) {
    const img = images[imgIndex];
    blocks.push({ type: 'image', filename: img.filename, width: img.width, height: img.height });
  }
  return blocks;
}

async function main() {
  const { manifest: manifestPath, out } = parseArgs(process.argv.slice(2));
  const manifest: Manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf-8'));
  const pdfPath = resolve(manifest.pdfPath);
  const knownHeaders = new Set((manifest.knownHeaders ?? []).map((h) => h.toUpperCase()));
  // Flat directory, not nested per-subject — filenames already carry the
  // subject as a prefix (see imageExtract.ts), which keeps the serving route
  // (GET /textbook/images/:filename) a simple single-directory lookup.
  const imagesDir = resolve(__dirname, '../../assets/textbook-images');
  // Figure filenames are "<prefix>-p<page>-<n>.jpg" in one flat directory, so
  // the prefix has to separate books that share a subject but reuse the same
  // page numbers — exactly what a teacher guide does against its student book.
  // Student books keep the bare subject prefix so the thousands of already
  // imported image references stay valid.
  const imagePrefix =
    manifest.kind === 'teacher_guide'
      ? `${manifest.subject}-g${manifest.grade}-teacher-guide`
      : manifest.subject;

  console.log(`Extracting ${manifest.sections.length} section(s) from ${pdfPath}...`);

  const results = [];
  for (const [i, section] of manifest.sections.entries()) {
    process.stdout.write(
      `  ${i + 1}/${manifest.sections.length} "${section.sectionTitle}" (p${section.pageStart}-${section.pageEnd})... `
    );
    const pages = await pdfPageStructure(pdfPath, section.pageStart, section.pageEnd);
    const nodes = pages.flatMap((page) => classifyPage(page, knownHeaders));

    const images: { filename: string; width: number; height: number }[] = [];
    for (let page = section.pageStart; page <= section.pageEnd; page += 1) {
      const pageImages = await extractContentFigures(pdfPath, page, imagesDir, imagePrefix);
      images.push(...pageImages);
    }

    const blocks = buildBlocks(nodes, images);
    const listCount = nodes.filter((n) => n.type === 'list').length;
    const tableCount = nodes.filter((n) => n.type === 'table').length;
    console.log(`${nodes.length} block(s) (${listCount} list, ${tableCount} table), ${images.length} figure(s)`);

    results.push({
      subject: manifest.subject,
      grade: manifest.grade,
      kind: manifest.kind ?? 'textbook',
      // generateManifest.ts's ToC-unit-heading detection doesn't recognize
      // every book's format — leaves unitTitle empty for several books
      // (hand-confirmed: 11 of 21 manifests this session, some entirely) —
      // and the schema requires a non-empty string. Falls back to the
      // section's own title so import doesn't hard-fail on it; the reader's
      // unit-grouping just won't be meaningful for these until that
      // detection is improved separately.
      unitTitle: section.unitTitle.trim() || section.sectionTitle,
      sectionTitle: section.sectionTitle,
      order: i,
      blocks,
      pageStart: section.pageStart,
      pageEnd: section.pageEnd,
    });
  }

  await cleanupBookImages(pdfPath);

  const kindSuffix = manifest.kind === 'teacher_guide' ? '-teacher-guide' : '';
  const outPath =
    out ? resolve(out) : resolve(__dirname, `output/textbook-${manifest.subject}-g${manifest.grade}${kindSuffix}.json`);
  await mkdir(resolve(outPath, '..'), { recursive: true });
  await writeFile(outPath, JSON.stringify(results, null, 2));

  const emptyCount = results.filter((r) => r.blocks.length === 0).length;
  const totalImages = results.reduce((sum, r) => sum + r.blocks.filter((b) => b.type === 'image').length, 0);
  console.log(`\nWrote ${results.length} section(s) (${totalImages} figure(s) total) to ${outPath}`);
  if (emptyCount > 0) console.log(`  ⚠️  ${emptyCount} section(s) came back with zero content — check the page range.`);
  console.log(`  Spot-check a few sections for leaked headers/footers, garbled pages, or wrong figures, then run:`);
  console.log(`  npm run ingest:import -- --textbook ${outPath} --subject ${manifest.subject}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
