// Turns a generateManifest.ts output file into a flat TSV extraction plan for
// extractLessonFromText.ts: one row per lesson, grouped into units by the
// manifest's unitTitle. Writes no DB rows and no lesson content — just a plan.
//
// This is a planning step only. The actual Lesson/Unit rows in the live DB are
// never created here; per backend/prisma/seed.ts's existing convention (see its
// comment above the Grade 11 Biology units), a unit only gets real lesson rows
// once its content is reviewed and added to seed.ts's LESSON_CONTENT — creating
// an empty Lesson row ahead of that makes it immediately reachable in the app
// with zero steps, which LessonScreen.tsx renders as a blank dead-end screen.
//
// Usage:
//   npm run ingest:lesson-plan -- --manifest ./scripts/ingest/manifests/biology-g9.json
//
// Output: scripts/ingest/manifests/plans/<subject>-g<grade>.tsv
//   columns: unitId  unitTitle  order  lessonId  lessonTitle  from  to
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// A single section's extraction cost scales with page count (~470 tokens/page,
// hand-confirmed when a 30-page section hit a 14152-token 413 against this
// account's 8000 TPM cap). 12 pages (~5600 tokens + prompt overhead) leaves
// comfortable headroom without needing a second, smaller fallback split.
const MAX_PAGES_PER_LESSON = 12;

interface ManifestSection {
  unitTitle: string;
  sectionTitle: string;
  pageStart: number;
  pageEnd: number;
}
interface Manifest {
  subject: string;
  grade: number;
  pdfPath: string;
  sections: ManifestSection[];
}

function clean(title: string): string {
  return title
    .replace(/[\x00-\x1f\x7f]/g, ' ') // control chars from broken PDF glyphs (e.g. "\u0007")
    .replace(/^\s*unit\s+\w+\s*:\s*/i, '') // "Unit 2: " prefix — redundant once grouped
    .replace(/^\s*\d+(\.\d+)*\.?\s*/, '') // leading numbering, e.g. "1.4 . "
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(title: string, maxLen = 50): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-+$/g, '');
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!args.manifest) throw new Error('Usage: --manifest <path.json>');
  return args;
}

async function main() {
  const { manifest: manifestPath } = parseArgs(process.argv.slice(2));
  const manifest: Manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf8'));
  const { subject, grade } = manifest;

  const rows: string[] = [];
  const unitSeen = new Map<string, string>(); // raw unitTitle -> unitId
  let unitIndex = 0;
  const lessonOrderByUnit = new Map<string, number>();
  const idsUsed = new Set<string>();

  function uniqueId(base: string): string {
    let id = base;
    let n = 2;
    while (idsUsed.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    idsUsed.add(id);
    return id;
  }

  for (const section of manifest.sections) {
    let unitId = unitSeen.get(section.unitTitle);
    if (!unitId) {
      unitIndex += 1;
      unitId = `${subject}-g${grade}-u${unitIndex}-${slug(clean(section.unitTitle), 30)}`;
      unitSeen.set(section.unitTitle, unitId);
      lessonOrderByUnit.set(unitId, 0);
    }

    const title = clean(section.sectionTitle);
    const pages = section.pageEnd - section.pageStart + 1;
    const chunks = Math.max(1, Math.ceil(pages / MAX_PAGES_PER_LESSON));

    for (let c = 0; c < chunks; c += 1) {
      const from = section.pageStart + c * Math.ceil(pages / chunks);
      const to = c === chunks - 1 ? section.pageEnd : section.pageStart + (c + 1) * Math.ceil(pages / chunks) - 1;
      const order = (lessonOrderByUnit.get(unitId) ?? 0) + 1;
      lessonOrderByUnit.set(unitId, order);

      const baseId = `${subject}-g${grade}-${slug(title)}`;
      const lessonId = chunks > 1 ? uniqueId(`${baseId}-pt${c + 1}`) : uniqueId(baseId);
      const lessonTitle = chunks > 1 ? `${title} (Part ${c + 1})` : title;

      rows.push([unitId, clean(section.unitTitle), order, lessonId, lessonTitle, from, to].join('\t'));
    }
  }

  const outDir = resolve(__dirname, 'manifests/plans');
  await mkdir(outDir, { recursive: true });
  const outPath = resolve(outDir, `${subject}-g${grade}.tsv`);
  await writeFile(outPath, rows.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${rows.length} lesson row(s) across ${unitIndex} unit(s) to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
