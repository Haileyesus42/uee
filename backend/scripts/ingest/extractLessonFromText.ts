// Converts a page range of a digital-text textbook PDF into a reviewable JSON
// file of LessonStep rows (the same explanation/example/question union used by
// seed.ts's LESSON_CONTENT and the frontend's LessonScreen.tsx). Text-based, not
// vision — these textbook PDFs have a real text layer (see docs/backend-architecture.md
// §10), so this is a structuring task for Groq, not an OCR one.
//
// Usage:
//   npm run ingest:lesson-text -- --input "./assets/books/<file>.pdf" --from 12 --to 15 \
//     --lessonId learning-from-nature --title "Learning From Nature"
//
// Output: backend/scripts/ingest/output/lesson-<lessonId>.json (override with --out).
// Like everything else in this pipeline, output is reviewed:false by default —
// importReviewed.ts --lesson refuses anything not explicitly marked reviewed:true.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pdfPageText } from './pdfText';
import { extractJsonFromText } from './groq';
import { env } from '../../src/env';
import { ExtractedLessonStepBatchSchema, ExtractedLessonStep } from './schemas';

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  const { input, from, to, lessonId, title, out } = args;
  if (!input || !from || !to || !lessonId || !title) {
    throw new Error('Usage: --input <path.pdf> --from <page> --to <page> --lessonId <id> --title "<title>" [--out <path>]');
  }
  return { input, from: Number(from), to: Number(to), lessonId, title, out };
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

async function main() {
  const { input, from, to, lessonId, title, out } = parseArgs(process.argv.slice(2));
  const inputPath = resolve(input);
  const text = await pdfPageText(inputPath, from, to);

  console.log(`Extracting lesson "${title}" (${lessonId}) from ${inputPath} pages ${from}-${to}...`);

  const raw = await extractJsonFromText(PROMPT_TEMPLATE(title, text), env.GROQ_TEXT_MODEL);
  const parsed = raw as { steps?: unknown[] };
  if (!parsed.steps) throw new Error('Groq response had no "steps" array');

  const results: ExtractedLessonStep[] = [];
  for (const [i, step] of parsed.steps.entries()) {
    try {
      results.push(
        ExtractedLessonStepBatchSchema.element.parse({ ...(step as object), reviewed: false, sourcePage: from })
      );
    } catch (err) {
      console.log(`  step ${i + 1}: skipped — failed validation (${(err as Error).message.split('\n')[0]})`);
    }
  }

  const outPath = out ? resolve(out) : resolve(__dirname, `output/lesson-${lessonId}.json`);
  await mkdir(resolve(outPath, '..'), { recursive: true });
  await writeFile(outPath, JSON.stringify(results, null, 2));

  console.log(`Wrote ${results.length} step(s) to ${outPath}`);
  console.log(`  All entries have reviewed:false — review against the source pages, then run:`);
  console.log(`  npm run ingest:import -- --lesson ${outPath} --lessonId ${lessonId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
