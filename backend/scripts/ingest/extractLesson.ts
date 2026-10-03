// Converts scanned textbook page images into a reviewable JSON file of structured
// LessonStep rows (the same explanation/example/question union used by seed.ts and
// the frontend's LessonScreen.tsx). Nothing here touches Postgres — see
// importReviewed.ts for the separate, review-gated step that writes to the database.
//
// Usage:
//   npm run ingest:lesson -- --input ./scripts/ingest/input/algebra-ch3 --title "Quadratic Equations"
//
// Input dir: one image per textbook page, named so alphabetical order matches
// reading order (e.g. page-01.png, page-02.png, ...).
// Output: backend/scripts/ingest/output/lesson-<slug of --title>.json (override with --out)
//
// IMPORTANT: everything written here has reviewed:false. Open the output file,
// check each step against the source pages, fix anything wrong, reorder/merge steps
// if the model split them oddly, flip reviewed to true, THEN run importReviewed.ts.
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { extractJsonFromImage } from './groq';
import { ExtractedLessonStepBatchSchema, ExtractedLessonStep } from './schemas';

const PROMPT = `You are transcribing one page of a Grade 9-12 textbook, for a student
studying for the Ethiopian University Entrance Exam (UEE).

Return ONLY a JSON object of the form {"steps": [...]}, where each item is ONE of:

{"type": "explanation", "heading": "...", "body": "..."}
  — a concept being taught, in the student's own textbook language.

{"type": "example", "heading": "...", "body": "...", "steps": ["...", "..."]}
  — a worked example. "steps" is the ordered list of solution steps.

{"type": "question", "prompt": "...", "options": ["...", "..."], "correctIndex": 0,
 "hint": "...", "explanation": "..."}
  — a practice question from the page (e.g. an end-of-section exercise with options,
  or a question you turn into multiple-choice from the page's exercise). Only include
  this if the page actually has a question — do not invent practice questions.

Split the page into as many steps as its content naturally requires; a single page may
produce zero, one, or several. If this page has no lesson content (e.g. a table of
contents or blank page), return {"steps": []}.`;

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  const { input, title, out } = args;
  if (!input || !title) {
    throw new Error('Usage: --input <dir> --title "<lesson title>" [--out <path>]');
  }
  return { input, title, out };
}

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const StepsEnvelopeSchema = z.object({ steps: z.array(z.unknown()) });

async function main() {
  const { input, title, out } = parseArgs(process.argv.slice(2));
  const inputDir = resolve(input);
  const files = (await readdir(inputDir))
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  if (files.length === 0) {
    throw new Error(`No images found in ${inputDir}`);
  }

  console.log(`Extracting ${files.length} page(s) from ${inputDir} for lesson "${title}"...`);

  const results: ExtractedLessonStep[] = [];
  for (const [i, file] of files.entries()) {
    const pageNumber = i + 1;
    process.stdout.write(`  page ${pageNumber}/${files.length} (${file})... `);
    try {
      const raw = await extractJsonFromImage(join(inputDir, file), PROMPT);
      const { steps } = StepsEnvelopeSchema.parse(raw);
      const validated = ExtractedLessonStepBatchSchema.parse(
        steps.map((s: unknown) => ({ ...(s as object), sourcePage: pageNumber, reviewed: false }))
      );
      results.push(...validated);
      console.log(`${validated.length} step(s)`);
    } catch (err) {
      console.log('FAILED');
      console.error(`    ${(err as Error).message}`);
    }
  }

  const outPath = out ? resolve(out) : resolve(__dirname, `output/lesson-${slugify(title)}.json`);
  await mkdir(resolve(outPath, '..'), { recursive: true });
  await writeFile(outPath, JSON.stringify(results, null, 2));

  console.log(`\nWrote ${results.length} step(s) to ${outPath}`);
  console.log(`  All entries have reviewed:false — review the file, then run importReviewed.ts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
