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
// Usage:
//   npm run ingest:textbook -- --manifest scripts/ingest/manifests/biology-g11.json
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pdfPageText } from './pdfText';
import { cleanTextbookPage } from './textCleanup';
import { extractContentFigures, cleanupBookImages } from './imageExtract';
import { ExtractedContentBlock } from './schemas';

type ManifestSection = { unitTitle: string; sectionTitle: string; pageStart: number; pageEnd: number };
type Manifest = {
  subject: string;
  grade: number;
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
function buildBlocks(
  paragraphs: string[],
  images: { filename: string; width: number; height: number }[]
): ExtractedContentBlock[] {
  const blocks: ExtractedContentBlock[] = [];
  let imgIndex = 0;
  for (const p of paragraphs) {
    if (FIGURE_CAPTION.test(p.trim()) && imgIndex < images.length) {
      const img = images[imgIndex];
      imgIndex += 1;
      blocks.push({ type: 'image', filename: img.filename, width: img.width, height: img.height, caption: p });
    } else {
      blocks.push({ type: 'text', text: p });
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

  console.log(`Extracting ${manifest.sections.length} section(s) from ${pdfPath}...`);

  const results = [];
  for (const [i, section] of manifest.sections.entries()) {
    process.stdout.write(
      `  ${i + 1}/${manifest.sections.length} "${section.sectionTitle}" (p${section.pageStart}-${section.pageEnd})... `
    );
    const raw = await pdfPageText(pdfPath, section.pageStart, section.pageEnd);
    const paragraphs = cleanTextbookPage(raw, knownHeaders);

    const images: { filename: string; width: number; height: number }[] = [];
    for (let page = section.pageStart; page <= section.pageEnd; page += 1) {
      const pageImages = await extractContentFigures(pdfPath, page, imagesDir, manifest.subject);
      images.push(...pageImages);
    }

    const blocks = buildBlocks(paragraphs, images);
    console.log(`${paragraphs.length} paragraph(s), ${images.length} figure(s)`);

    results.push({
      subject: manifest.subject,
      grade: manifest.grade,
      unitTitle: section.unitTitle,
      sectionTitle: section.sectionTitle,
      order: i,
      blocks,
      pageStart: section.pageStart,
      pageEnd: section.pageEnd,
    });
  }

  await cleanupBookImages(pdfPath);

  const outPath = out ? resolve(out) : resolve(__dirname, `output/textbook-${manifest.subject}-g${manifest.grade}.json`);
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
