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
- prompt: the question text, transcribed exactly as written, with all math rendered as LaTeX
- options: array of the answer choices, transcribed exactly (do not reorder them), with all math rendered as LaTeX
- correctIndex: 0-based index of the correct option. Use the paper's own answer key if this
  page shows one; otherwise determine it yourself and set confidence to "low".
- answerSource: "official" if correctIndex came from the paper's own answer key/marker on the
  page, "derived" if you worked it out yourself because the page showed none.
- explanation: if the page shows a worked solution, transcribe it and set
  explanationSource to "transcribed". If not, write a short, correct explanation
  yourself and set explanationSource to "generated".
- confidence: "low" if the scan is unclear, the question is cut off, or you are unsure
  of the correct answer; otherwise "high".

CRITICAL LaTeX RULES for prompt, options, and explanation:

1. Wrap EVERY math expression in $...$ for inline, $$...$$ for display.
   - A standalone number "2" stays plain "2"; but "2x" becomes $2x$.
   - A standalone variable "x" becomes $x$.
   - "3 cm" becomes $3\text{ cm}$.

2. Convert Unicode math characters to LaTeX:
   - pi -> \pi, theta -> \theta, sqrt -> \sqrt{}, infinity -> \infty
   - superscript digits -> ^N inside math mode
   - multiply -> \times, divide -> \div, less-or-equal -> \leq, greater-or-equal -> \geq, not-equal -> \neq

3. ALWAYS use \dfrac{num}{den} for fractions, NEVER "num/den":
   - 1/2 -> $\dfrac{1}{2}$
   - (a+b)/c -> $\dfrac{a+b}{c}$

4. Subscripts use _{}: a_1, a_n, a_{n+1}
5. Superscripts use ^{}: x^2, x^{-1}, x^{n+1}
6. Multi-char sub/superscripts MUST use braces: x^{10} NOT x^10

7. Limits, sums, integrals include bounds:
   - lim(n -> infinity) -> $\lim_{n \to \infty}$
   - sum from i=1 to n -> $\sum_{i=1}^{n}$

8. Preserve tables as markdown tables inside the prompt.
9. Preserve multi-part questions as sequential prompts (Part (a): ..., Part (b): ...).

10. NEVER leave a backslash command unwrapped. Every LaTeX command lives inside $...$.
11. NEVER mix Unicode math with LaTeX in the same expression - convert everything to LaTeX.
12. NEVER add markdown headers (##, ###).

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
