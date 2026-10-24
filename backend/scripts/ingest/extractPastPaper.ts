// Converts scanned past-paper page images into a reviewable JSON file of
// structured Question rows. Nothing here touches Postgres — see importReviewed.ts
// for the separate, review-gated step that actually writes to the database.
//
// Usage:
//   npm run ingest:paper -- --input ./scripts/ingest/input/math-2015 --subject mathematics --year 2015
//
// Input dir: one image per page (png/jpg/webp), named so alphabetical order matches
// page order (e.g. page-01.png, page-02.png, ...).
// Output: backend/scripts/ingest/output/<subject>-<year>.json (override with --out)
//
// IMPORTANT: everything written here has reviewed:false. Open the output file,
// check each question's options/correctIndex against the actual scanned page, fix
// anything wrong, flip reviewed to true, THEN run importReviewed.ts. Pay closer
// attention to items with confidence:"low" or explanationSource:"generated".
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { extractJsonFromImage } from './groq';
import { ExtractedQuestionBatchSchema, ExtractedQuestion } from './schemas';

// Unwraps the {"questions": [...]} envelope before the real per-item validation
// in schemas.ts runs.
const QuestionsEnvelopeSchema = z.object({ questions: z.array(z.unknown()) });

const PROMPT = `You are transcribing one page of a scanned Ethiopian University Entrance Exam (UEE) past paper.

Return ONLY a JSON object of the form {"questions": [...]}, where each item has:
- prompt: the question text, transcribed exactly as written
- options: array of the answer choices, transcribed exactly (do not reorder them)
- correctIndex: 0-based index of the correct option. Use the paper's own answer key if this
  page shows one; otherwise determine it yourself and set confidence to "low".
- answerSource: "official" if correctIndex came from the paper's own answer key/marker on the
  page, "derived" if you worked it out yourself because the page showed none.
- explanation: if the page shows a worked solution, transcribe it and set
  explanationSource to "transcribed". If not, write a short, correct explanation
  yourself and set explanationSource to "generated".
- confidence: "low" if the scan is unclear, the question is cut off, or you are unsure
  of the correct answer; otherwise "high".

If this page has no multiple-choice questions on it (e.g. a cover page or instructions),
return {"questions": []}. Do not invent questions that aren't on the page.`;

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  const { input, subject, year, out } = args;
  if (!input || !subject || !year) {
    throw new Error('Usage: --input <dir> --subject <slug> --year <number> [--out <path>]');
  }
  return { input, subject, year: Number(year), out };
}

async function main() {
  const { input, subject, year, out } = parseArgs(process.argv.slice(2));
  const inputDir = resolve(input);
  const files = (await readdir(inputDir))
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  if (files.length === 0) {
    throw new Error(`No images found in ${inputDir}`);
  }

  console.log(`Extracting ${files.length} page(s) from ${inputDir}...`);

  const results: ExtractedQuestion[] = [];
  for (const [i, file] of files.entries()) {
    const pageNumber = i + 1;
    process.stdout.write(`  page ${pageNumber}/${files.length} (${file})... `);
    try {
      const raw = await extractJsonFromImage(join(inputDir, file), PROMPT);
      const { questions } = QuestionsEnvelopeSchema.parse(raw);
      const validated = ExtractedQuestionBatchSchema.parse(
        questions.map((q: unknown) => ({ ...(q as object), sourcePage: pageNumber, reviewed: false }))
      );
      results.push(...validated);
      console.log(`${validated.length} question(s)`);
    } catch (err) {
      console.log('FAILED');
      console.error(`    ${(err as Error).message}`);
    }
  }

  const outPath = out ? resolve(out) : resolve(__dirname, `output/${subject}-${year}.json`);
  await mkdir(resolve(outPath, '..'), { recursive: true });
  await writeFile(outPath, JSON.stringify(results, null, 2));

  const lowConfidence = results.filter((r) => r.confidence === 'low').length;
  const generated = results.filter((r) => r.explanationSource === 'generated').length;
  console.log(`\nWrote ${results.length} question(s) to ${outPath}`);
  console.log(`  ${lowConfidence} flagged low-confidence, ${generated} with a generated (not transcribed) explanation.`);
  console.log(`  All entries have reviewed:false — review the file, then run importReviewed.ts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
