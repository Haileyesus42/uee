// One-off audit tool for ~/Downloads/ethiopian-national-exams — that folder's
// filenames turned out NOT to reliably describe their contents (confirmed by
// hand: "biology/biology-2013-answers.pdf" is actually printed "BIOLOGY
// EXAMINTION 2005" E.C. on the page, a saved euee.epizy.com printout, not a raw
// MoE scan). Renders page 1 of every readable PDF in the folder and asks Groq
// vision what it actually is, so the 2004-2020 backfill audit is grounded in
// real content instead of filenames. Read-only: writes one inventory JSON,
// touches nothing in the app's own scripts/assets or the database.
//
// Usage:
//   npx tsx scripts/ingest/identifyNationalExams.ts
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { promisify } from 'node:util';
import { extractJsonFromImage } from './groq';

const execFileAsync = promisify(execFile);
const SOURCE_ROOT = join(homedir(), 'Downloads', 'ethiopian-national-exams');
// Disposable page-1 renders, regenerated on every run — kept out of the repo
// tree entirely (not just gitignored) so a run never leaves stray files for
// git status to report.
const RENDER_DIR = join(tmpdir(), 'uee-exam-render');
const OUT_PATH = resolve(__dirname, 'output/national-exams-inventory.json');

// Deliberately does NOT ask the model to decide which calendar a bare year is
// in, or to convert EC<->GC itself — hand-confirmed on this exact folder that
// doing so silently defaults an unlabeled year to Gregorian even when the page
// is actually using the Ethiopian calendar (e.g. a page printing bare "2005"
// that a direct human read of the rendered page confirmed was "2005 E.C.", not
// G.C. — almost 8 years off). Instead this only asks for the literal printed
// digits and whatever calendar-marker text is actually visible, and the EC/GC
// resolution happens afterward in code, where it's auditable.
const IDENTIFY_PROMPT = `This is page 1 of an Ethiopian exam-paper PDF. Look at the actual printed content (ignore any filename) and answer:
- subject: the subject being examined (e.g. "biology", "chemistry", "english")
- yearDigits: the year number printed on the page, EXACTLY as printed (e.g. 2005), or null if no year appears at all
- calendarMarker: any explicit calendar label printed next to that year — "EC" (for "E.C.", "Ethiopian Calendar", or the Amharic "ዓ.ም"), "GC" (for "G.C.", "Gregorian", or "AD"), or null if the page prints the year with no such label either way
- grade: the grade level if shown (e.g. 12, 10), or null
- paperType: one of "questions-only", "questions-with-marked-answers" (answers visible inline, e.g. checkmarks), "answer-key-only" (just an answer list, no question text), or "unclear"
- region: any regional variant named (e.g. "Tigray"), or null if it's the standard national paper
- sourceUrl: any URL printed on the page (e.g. a footer like "euee.epizy.com/..."), or null
- confidence: "high" if the page clearly states these facts, "low" if you're inferring/guessing any of them
Return strict JSON with exactly these keys. Do not convert or guess a calendar for yearDigits yourself — report only what's literally printed.`;

type Identification = {
  file: string;
  subject: string | null;
  yearDigits: number | null;
  calendarMarker: 'EC' | 'GC' | null;
  examYearEC: number | null;
  examYearGC: number | null;
  // How examYearEC/examYearGC were derived — 'assumed-ec-no-marker' means the
  // page printed a bare year with no "E.C."/"G.C." label, so EC was assumed
  // (this folder's own confirmed precedent, see the header comment) and the GC
  // side is computed, NOT printed. Keeping this distinct from 'printed-ec'
  // means a reviewer can tell an assumption from a stated fact at a glance.
  yearResolution: 'printed-gc' | 'printed-ec' | 'assumed-ec-no-marker' | 'no-year-found';
  grade: number | null;
  paperType: string | null;
  region: string | null;
  sourceUrl: string | null;
  confidence: string | null;
  error?: string;
};

// EC -> GC offset for Ethiopian academic-year exam sittings — empirically
// confirmed twice independently in this project (Kehulum's own ec_year/gc_year
// pairs for 2013-2017 EC, and the "GINBOT 2009 / MAY 2017" etc. dual-year
// headers in backend/assets/exams's English set): EC + 8 = GC.
const EC_TO_GC_OFFSET = 8;

function resolveYear(
  yearDigits: number | null,
  calendarMarker: 'EC' | 'GC' | null
): Pick<Identification, 'examYearEC' | 'examYearGC' | 'yearResolution'> {
  if (yearDigits == null) return { examYearEC: null, examYearGC: null, yearResolution: 'no-year-found' };
  if (calendarMarker === 'GC') return { examYearEC: null, examYearGC: yearDigits, yearResolution: 'printed-gc' };
  if (calendarMarker === 'EC') {
    return { examYearEC: yearDigits, examYearGC: yearDigits + EC_TO_GC_OFFSET, yearResolution: 'printed-ec' };
  }
  return { examYearEC: yearDigits, examYearGC: yearDigits + EC_TO_GC_OFFSET, yearResolution: 'assumed-ec-no-marker' };
}

// pdftoppm pads the page-number suffix it appends to the prefix to the digit
// width of the page RANGE REQUESTED — confirmed by hand: a 1-page request on a
// file with >9 total pages still comes out "-01", not "-1" (not simply "always
// 1 digit for a 1-page request" as first assumed, which silently produced zero
// real renders — every file looked "unreadable" because the exact filename
// guess never matched, not because the source was actually corrupt). Globbing
// for whatever pdftoppm actually wrote avoids depending on that width at all.
async function renderPage1(pdfPath: string, outPrefix: string): Promise<string | null> {
  try {
    await execFileAsync('pdftoppm', ['-f', '1', '-l', '1', '-r', '120', '-png', pdfPath, outPrefix]);
  } catch {
    return null;
  }
  const dir = resolve(outPrefix, '..');
  const prefixName = basename(outPrefix);
  const match = (await readdir(dir)).find((f) => f.startsWith(`${prefixName}-`) && f.endsWith('.png'));
  return match ? join(dir, match) : null;
}

// Resumable: a prior run can be cut short by Groq's *daily* token quota (not
// just per-minute — hand-confirmed hitting a 200k TPD cap partway through this
// exact folder, which cleanly 429s every remaining call instead of hanging, per
// groq.ts's fetchGroqWithRetry). Re-running only re-spends tokens on files that
// haven't got a confirmed result yet — a real render failure (render_failed) is
// kept as-is rather than retried, since that's the file, not the quota.
async function loadPriorResults(): Promise<Map<string, Identification>> {
  try {
    const raw = JSON.parse(await readFile(OUT_PATH, 'utf-8')) as Identification[];
    return new Map(raw.map((r) => [r.file, r]));
  } catch {
    return new Map();
  }
}

async function main() {
  await mkdir(RENDER_DIR, { recursive: true });
  const subjects = (await readdir(SOURCE_ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const prior = await loadPriorResults();
  const resumable = [...prior.values()].filter((r) => !r.error || r.error === 'render_failed').length;
  if (prior.size > 0) console.log(`Resuming: ${resumable} file(s) already confirmed from a prior run, keeping those.`);

  const results: Identification[] = [];
  let i = 0;
  for (const subjectDir of subjects) {
    const dirPath = join(SOURCE_ROOT, subjectDir);
    const files = (await readdir(dirPath)).filter((f) => f.endsWith('.pdf'));
    for (const file of files) {
      i += 1;
      const key = `${subjectDir}/${file}`;
      const prev = prior.get(key);
      if (prev && (!prev.error || prev.error === 'render_failed')) {
        results.push(prev);
        console.log(`[${i}] ${key}... kept from prior run (${prev.error ?? `${prev.subject} EC${prev.examYearEC}/GC${prev.examYearGC}`})`);
        continue;
      }
      const pdfPath = join(dirPath, file);
      const pngPrefix = join(RENDER_DIR, `${subjectDir}-${basename(file, '.pdf')}`);
      process.stdout.write(`[${i}] ${subjectDir}/${file}... `);

      const pngPath = await renderPage1(pdfPath, pngPrefix);
      if (!pngPath) {
        console.log('UNREADABLE (render failed, likely corrupt structure)');
        results.push({
          file: `${subjectDir}/${file}`,
          subject: null,
          yearDigits: null,
          calendarMarker: null,
          examYearEC: null,
          examYearGC: null,
          yearResolution: 'no-year-found',
          grade: null,
          paperType: null,
          region: null,
          sourceUrl: null,
          confidence: null,
          error: 'render_failed',
        });
        continue;
      }

      try {
        const raw = (await extractJsonFromImage(pngPath, IDENTIFY_PROMPT)) as Record<string, unknown>;
        const yearDigits = (raw.yearDigits as number) ?? null;
        const calendarMarker = (raw.calendarMarker as 'EC' | 'GC') ?? null;
        const id: Identification = {
          file: `${subjectDir}/${file}`,
          subject: (raw.subject as string) ?? null,
          yearDigits,
          calendarMarker,
          ...resolveYear(yearDigits, calendarMarker),
          grade: (raw.grade as number) ?? null,
          paperType: (raw.paperType as string) ?? null,
          region: (raw.region as string) ?? null,
          sourceUrl: (raw.sourceUrl as string) ?? null,
          confidence: (raw.confidence as string) ?? null,
        };
        results.push(id);
        console.log(
          `${id.subject} EC${id.examYearEC}/GC${id.examYearGC} (${id.yearResolution}) grade${id.grade} [${id.paperType}] conf=${id.confidence}`
        );
      } catch (err) {
        console.log(`VISION ERROR: ${err instanceof Error ? err.message : err}`);
        results.push({
          file: `${subjectDir}/${file}`,
          subject: null,
          yearDigits: null,
          calendarMarker: null,
          examYearEC: null,
          examYearGC: null,
          yearResolution: 'no-year-found',
          grade: null,
          paperType: null,
          region: null,
          sourceUrl: null,
          confidence: null,
          error: 'vision_error',
        });
      }
    }
  }

  await mkdir(resolve(__dirname, 'output'), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} identification(s) to ${OUT_PATH}`);
  const unreadable = results.filter((r) => r.error).length;
  console.log(`${unreadable} file(s) could not be rendered/identified.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
