// Drives extractLessonFromText.ts across every row of a manifestToLessonPlan.ts
// TSV. Resumable by construction — it skips any lessonId that already has an
// output file, so re-running the same plan after an interruption (rate limit,
// crash, closed laptop) just picks up where it left off, no state to track.
//
// Stops the whole run the moment a row fails on Groq's *daily* token quota
// (hand-confirmed: 200k TPD on this account, reported as "try again in 18m34s"
// — tens of minutes, not worth sitting through). Every other row's failure
// (a single bad generation, a network blip) is logged and skipped so one
// lesson can't block the rest of the subject.
//
// Usage:
//   npm run ingest:lesson-run -- --plan ./scripts/ingest/manifests/plans/biology-g9.tsv --book ./assets/books/<file>.pdf
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pdfPageText } from './pdfText';
import { extractJsonFromText } from './groq';
import { env } from '../../src/env';
import { ExtractedLessonStepBatchSchema, ExtractedLessonStep } from './schemas';
import { writeFile, mkdir } from 'node:fs/promises';

interface PlanRow {
  unitId: string;
  unitTitle: string;
  order: number;
  lessonId: string;
  title: string;
  from: number;
  to: number;
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!args.plan || !args.book) throw new Error('Usage: --plan <path.tsv> --book <path.pdf>');
  return args;
}

function parsePlan(tsv: string): PlanRow[] {
  return tsv
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [unitId, unitTitle, order, lessonId, title, from, to] = line.split('\t');
      return { unitId, unitTitle, order: Number(order), lessonId, title, from: Number(from), to: Number(to) };
    });
}

const PROMPT_TEMPLATE = (title: string, text: string) => `You are converting a page range of a Grade 9-12 Ethiopian textbook into lesson steps for a UEE exam-prep app. The lesson is titled "${title}".

Return ONLY a JSON object {"steps": [...]}, where each item is ONE of:

{"type": "explanation", "heading": "...", "body": "..."}
  — a concept from the text, explained in the student's own textbook language. Split
  the material into as many explanation steps as it naturally needs — don't cram
  everything into one giant block.

{"type": "example", "heading": "...", "body": "...", "steps": ["...", "..."]}
  — a worked example or illustrative case from the text, if one is present.

{"type": "question", "prompt": "...", "options": ["...","...","...","..."], "correctIndex": 0, "hint": "...", "explanation": "..."}
  — a practice question testing the material above. Write 2-4 of these per lesson,
  even if the source text doesn't have ready-made multiple-choice questions — base
  them strictly on the content actually covered above, not outside knowledge.

Source text:
"""
${text}
"""`;

async function extractOne(bookPath: string, row: PlanRow, outDir: string, existing: Set<string>): Promise<'ok' | 'skip-exists'> {
  const outPath = resolve(outDir, `lesson-${row.lessonId}.json`);
  if (existing.has(`lesson-${row.lessonId}.json`)) return 'skip-exists';

  const text = await pdfPageText(bookPath, row.from, row.to);
  const raw = await extractJsonFromText(PROMPT_TEMPLATE(row.title, text), env.GROQ_TEXT_MODEL);
  const parsed = raw as { steps?: unknown[] };
  if (!parsed.steps) throw new Error('Groq response had no "steps" array');

  const results: ExtractedLessonStep[] = [];
  for (const step of parsed.steps) {
    try {
      results.push(
        ExtractedLessonStepBatchSchema.element.parse({ ...(step as object), reviewed: false, sourcePage: row.from })
      );
    } catch {
      // one malformed step shouldn't drop the rest of an otherwise-good lesson
    }
  }
  await writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  return 'ok';
}

async function main() {
  const { plan: planPath, book: bookPath } = parseArgs(process.argv.slice(2));
  const rows = parsePlan(await readFile(resolve(planPath), 'utf8'));
  const outDir = resolve(__dirname, 'output');
  await mkdir(outDir, { recursive: true });
  const existing = new Set(await readdir(outDir));

  let done = 0;
  let skipped = 0;
  for (const row of rows) {
    process.stdout.write(`${row.lessonId} (p${row.from}-${row.to})... `);
    let result: 'ok' | 'skip-exists';
    try {
      result = await extractOne(bookPath, row, outDir, existing);
    } catch (err) {
      const message = (err as Error).message;
      console.log(`FAILED — ${message.split('\n')[0]}`);
      if (/tokens per day|TPD/i.test(message)) {
        console.log(`\nSTOPPED: daily token quota reached. ${done} done this run, ${skipped} already had output.`);
        console.log(`${rows.length - done - skipped - 1} lesson(s) still pending in this plan — rerun the same command once quota resets.`);
        process.exit(2); // distinct code: "stopped on quota", not "crashed"
      }
      continue; // any other error: log and move to the next lesson
    }
    if (result === 'skip-exists') {
      skipped += 1;
      console.log('already done, skipped');
    } else {
      done += 1;
      console.log('done');
    }
  }
  console.log(`\nPlan complete: ${done} extracted this run, ${skipped} already done, ${rows.length} total.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
