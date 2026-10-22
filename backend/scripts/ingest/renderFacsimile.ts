// Builds a facsimile (page-image) edition of a textbook from an existing
// manifest. Every page in a section's range is rendered once with pdftoppm and
// stored as an image block, so the reader shows the printed page verbatim —
// equations, diagrams, tables and non-Latin script included — with the
// full-screen viewer that already exists for image blocks.
//
// Why this exists: text reconstruction from these print PDFs cannot represent
// 2D content (maths, tables, figures), and layout-aware converters (MinerU,
// Marker) cannot run on this host. A facsimile edition is the only release-grade
// output available that never invents or garbles content.
//
// Usage:
//   npx tsx scripts/ingest/renderFacsimile.ts \
//     --manifest scripts/ingest/manifests/mathematics-g12-old.json \
//     --out scripts/ingest/output/textbook-mathematics-g12-facsimile.json \
//     [--dpi 150]
//
// Idempotent: an existing page JPEG larger than 10 KB is reused, so re-running
// after a partial failure only renders what is missing.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type ManifestSection = { unitTitle: string; sectionTitle: string; pageStart: number; pageEnd: number };
type Manifest = {
  subject: string;
  grade: number;
  kind?: 'textbook' | 'teacher_guide';
  pdfPath: string;
  sections: ManifestSection[];
};

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!args.manifest || !args.out) {
    throw new Error('Usage: --manifest <path> --out <path> [--dpi 150]');
  }
  return { manifest: args.manifest, out: args.out, dpi: Number(args.dpi ?? 150) };
}

// Minimal JPEG dimension reader: scans for a Start-Of-Frame marker and reads
// the height/width it carries. Avoids pulling in an image library for two ints.
async function jpegSize(path: string): Promise<{ width: number; height: number }> {
  const buf = await readFile(path);
  let i = 2; // skip SOI
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  throw new Error(`could not read JPEG dimensions from ${path}`);
}

// Front matter is classified from each page's own text. Scanned books with no
// text layer fall back to a single "Front matter" section, which is the most
// that can be known without OCR.
function classifyFrontMatterPage(text: string, page: number): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const head = lines.slice(0, 6).join(' ').toLowerCase();
  const all = text.toLowerCase();

  if (page === 1) return 'Cover';
  if (lines.length === 0) return 'Blank page';
  if (/property of your school/.test(all)) return 'School property';
  if (/\b(first published|copyright|all rights reserved)\b|©/.test(all)) return 'Copyright';
  if (/welcoming message/.test(head)) return 'Welcoming Message';
  if (/\bforeword\b/.test(head)) return 'Foreword';
  if (/\bpreface\b/.test(head)) return 'Preface';
  if (/acknowledg/.test(head)) return 'Acknowledgements';
  if (/^\s*(table of )?contents\b/i.test(lines[0] ?? '')) return 'Table of Contents';
  // Continuation pages of a contents spread: several leader lines ending in a
  // page number (dots, ellipses or underscore runs).
  const tocLike = lines.filter((l) => /(?:[.\u2026_]\s*){3,}\d{1,4}\s*$/.test(l)).length;
  if (tocLike >= 3) return 'Table of Contents';
  if (/^unit\s+[0-9]/i.test(lines[0] ?? '')) return 'Unit opener';
  if (/student textbook/.test(all) && /grade\s*\d/i.test(all)) return 'Title page';
  if (/how to use|example and solution/.test(head)) return 'How to Use This Book';
  if (/^\s*introduction\b/i.test(lines[0] ?? '')) return 'Introduction';
  return 'Front matter';
}

async function pageText(pdfPath: string, page: number): Promise<string> {
  try {
    const { stdout } = await execFileAsync('pdftotext', ['-f', String(page), '-l', String(page), '-layout', pdfPath, '-'], {
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout;
  } catch {
    return '';
  }
}

// Consecutive pages of the same kind form one section (a two-page contents
// spread is one "Table of Contents"), and the titles carry no section numbers
// so they can never be mistaken for Unit 1 / Section 1.
async function buildFrontMatterSections(
  pdfPath: string,
  lastPage: number
): Promise<{ unitTitle: string; sectionTitle: string; pageStart: number; pageEnd: number }[]> {
  const texts: string[] = [];
  for (let page = 1; page <= lastPage; page += 1) {
    texts.push(await pageText(pdfPath, page));
  }
  // A page with no text is only "blank" when the book has a text layer at all;
  // in a scan every page is textless, so that would label the whole front
  // matter "Blank page".
  const hasTextLayer = texts.some((t) => t.trim().length > 20);

  const out: { unitTitle: string; sectionTitle: string; pageStart: number; pageEnd: number }[] = [];
  const seen = new Map<string, number>();

  for (let page = 1; page <= lastPage; page += 1) {
    let label = classifyFrontMatterPage(texts[page - 1], page);
    if (!hasTextLayer && label === 'Blank page') label = 'Front matter';

    const prev = out[out.length - 1];
    if (prev && prev.sectionTitle === label && prev.pageEnd === page - 1) {
      prev.pageEnd = page;
      continue;
    }
    const seenCount = seen.get(label) ?? 0;
    seen.set(label, seenCount + 1);
    out.push({
      unitTitle: 'Front matter',
      // Only disambiguate repeats that are not adjacent.
      sectionTitle: seenCount === 0 ? label : `${label} ${seenCount + 1}`,
      pageStart: page,
      pageEnd: page,
    });
  }
  return out;
}

async function main() {
  const { manifest: manifestPath, out, dpi } = parseArgs(process.argv.slice(2));
  const manifest: Manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf-8'));
  const pdfPath = resolve(manifest.pdfPath);
  if (!existsSync(pdfPath)) throw new Error(`source PDF not found: ${pdfPath}`);

  const kind = manifest.kind ?? 'textbook';
  const prefix = `${manifest.subject}-g${manifest.grade}${kind === 'teacher_guide' ? '-teacher-guide' : ''}`;
  const imagesDir = resolve(__dirname, '../../assets/textbook-images');
  await mkdir(imagesDir, { recursive: true });

  let rendered = 0;
  let reused = 0;
  let bytes = 0;
  const sections = [];

  // Manifests derive their ranges from the table of contents, so anything
  // before the first section (cover, title page, contents) is not covered.
  // Classify those pages into their own sections instead of one "Front matter"
  // blob, so they read as cover/contents/preface and never as Section 1.
  const firstSectionPage = Math.min(...manifest.sections.map((s) => s.pageStart));
  const frontMatter =
    firstSectionPage > 1 ? await buildFrontMatterSections(pdfPath, firstSectionPage - 1) : [];
  const renderSections = [...frontMatter, ...manifest.sections];

  for (const section of renderSections) {
    const blocks: object[] = [];
    for (let page = section.pageStart; page <= section.pageEnd; page += 1) {
      const stem = `${prefix}-page${String(page).padStart(3, '0')}`;
      const jpg = resolve(imagesDir, `${stem}.jpg`);
      let size = 0;
      try {
        size = (await stat(jpg)).size;
      } catch {
        size = 0;
      }

      if (size > 10_000) {
        reused += 1;
      } else {
        await execFileAsync('pdftoppm', [
          '-f', String(page), '-l', String(page), '-singlefile',
          '-r', String(dpi), '-jpeg', '-jpegopt', 'quality=80',
          pdfPath, resolve(imagesDir, stem),
        ], { maxBuffer: 16 * 1024 * 1024 });
        rendered += 1;
        size = (await stat(jpg)).size;
      }

      bytes += size;
      const { width, height } = await jpegSize(jpg);
      blocks.push({
        type: 'image',
        filename: `${stem}.jpg`,
        width,
        height,
        caption: `Page ${page}`,
      });
    }

    sections.push({
      subject: manifest.subject,
      grade: manifest.grade,
      kind,
      unitTitle: section.unitTitle.trim() || section.sectionTitle,
      sectionTitle: section.sectionTitle,
      order: renderSections.indexOf(section),
      blocks,
      pageStart: section.pageStart,
      pageEnd: section.pageEnd,
    });
  }

  await mkdir(resolve(out, '..'), { recursive: true });
  await writeFile(resolve(out), JSON.stringify(sections, null, 2));
  console.log(
    `Facsimile: ${sections.length} section(s), ${rendered} page(s) rendered, ${reused} reused, ` +
      `${(bytes / 1024 / 1024).toFixed(1)} MB -> ${out}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
