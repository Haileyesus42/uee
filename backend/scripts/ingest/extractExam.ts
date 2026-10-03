// Converts an exam file (PDF or DOCX, already-digital text — not a scan) into a
// reviewable JSON file of structured Question rows. Prefers deterministic parsing
// (parseExamText.ts) over the LLM wherever the source format allows it.
//
// Usage:
//   npm run ingest:exam -- --input "./assets/exams/2016 biology grade 12 exam.pdf" --subject biology --year 2016
//
// Three distinct situations, handled differently:
//
// 1. Marker present and reliable for this file (checked file-wide, not just
//    per-question — see isAnswerKeyUnreliable) — trust it, zero LLM cost.
// 2. Marker present but file-wide UNRELIABLE (confirmed on real files: Biology
//    and History 2016 both had the "'" marker stuck on option A for ~100% of
//    questions, apparently a bug in whatever tool generated the PDF — while
//    English and SAT 2016 had a normal spread). In this case the marker is
//    ignored entirely and the correct answer is instead DERIVED from each
//    question's own explanation text via Groq — a much safer task than open
//    generation, since it's matching given reasoning to one of 4 given options,
//    not inventing a fact. Always flagged low-confidence for review either way.
// 3. No marker recoverable at all (confirmed true for every .docx file in
//    assets/exams as of 2026-08-15 — these are raw exam papers graded against a
//    separate answer sheet that isn't part of the file). Extracts prompt+options
//    only, correctIndex stays -1, and importReviewed.ts hard-rejects any
//    reviewed:true item with an out-of-range correctIndex — this only saves the
//    transcription work, an external answer key is still needed.
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { pdfPageText } from './pdfText';
import { docxText } from './docxText';
import {
  parseExamQuestions,
  findHeaderLine,
  isAnswerKeyUnreliable,
  explanationContradictsAnswer,
  ParsedExamQuestion,
} from './parseExamText';
import { extractJsonFromText } from './groq';
import { env } from '../../src/env';
import { ExtractedQuestion, ExtractedQuestionSchema } from './schemas';

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
    throw new Error('Usage: --input <path.pdf|.docx> --subject <slug> --year <number> [--out <path>]');
  }
  return { input, subject, year: Number(year), out };
}

async function reconstructFromRawText(rawText: string): Promise<Partial<ParsedExamQuestion> | null> {
  const prompt = `Structure this exam question into JSON: {"question": {"prompt": "...", "options": ["...","..."], "correctIndex": <0-based index, or -1 if there's a correct-answer marker but you can't tell which option it's on>, "explanation": "..." (empty string if none is present)}}.
Text:
"""
${rawText}
"""`;
  try {
    const raw = await extractJsonFromText(prompt, env.GROQ_TEXT_MODEL);
    const parsed = raw as { question?: Partial<ParsedExamQuestion> };
    return parsed.question ?? null;
  } catch (err) {
    console.error(`    Groq reconstruction failed: ${(err as Error).message}`);
    return null;
  }
}

// Matches explanation reasoning to one of the given options — a constrained
// matching task, not open fact generation, so it's a reasonable thing to trust
// an LLM with even for content the pipeline otherwise treats cautiously.
async function deriveAnswerFromExplanation(
  prompt: string,
  options: string[],
  explanation: string
): Promise<number | null> {
  const req = `An exam question's correct-answer marker is unreliable and can't be trusted. Determine the correct option from the explanation's own reasoning instead. Return JSON: {"correctIndex": <0-based index, or -1 if the explanation doesn't make it clear>}.
Question: ${prompt}
Options: ${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(' | ')}
Explanation: ${explanation}`;
  try {
    const raw = (await extractJsonFromText(req, env.GROQ_TEXT_MODEL)) as { correctIndex?: number };
    const idx = raw.correctIndex;
    return typeof idx === 'number' && idx >= 0 && idx < options.length ? idx : -1;
  } catch (err) {
    console.error(`    Groq answer-derivation failed: ${(err as Error).message}`);
    return null;
  }
}

async function generateExplanation(prompt: string, options: string[], correctIndex: number): Promise<string> {
  const req = `The correct answer to this exam question is option ${correctIndex + 1} ("${options[correctIndex]}"). Write a short, correct explanation of why. Return JSON: {"explanation": "..."}.
Question: ${prompt}
Options: ${options.join(' | ')}`;
  const raw = (await extractJsonFromText(req, env.GROQ_TEXT_MODEL)) as { explanation?: string };
  return raw.explanation ?? '';
}

async function main() {
  const { input, subject, year, out } = parseArgs(process.argv.slice(2));
  const inputPath = resolve(input);
  const ext = extname(inputPath).toLowerCase();

  let text: string;
  if (ext === '.pdf') {
    text = await pdfPageText(inputPath, 1, 999);
  } else if (ext === '.docx') {
    text = await docxText(inputPath);
  } else {
    throw new Error(`Unsupported file type "${ext}" — expected .pdf or .docx`);
  }

  const header = findHeaderLine(text);
  console.log(`Source: ${inputPath}`);
  console.log(header ? `Header line found: "${header}"` : 'No "Grade · Subject · Year" header line found in the text.');

  const parsed = parseExamQuestions(text);
  const withKey = parsed.filter((q) => q.correctIndex >= 0).length;
  const fileHasNoKey = parsed.length > 0 && withKey === 0;
  const markerUnreliable = !fileHasNoKey && isAnswerKeyUnreliable(parsed);

  if (fileHasNoKey) {
    console.log(
      `\n⚠️  None of the ${parsed.length} question(s) in this file have a recoverable answer key ` +
        `(no "'" marker found anywhere). Extracting prompt+options only — every item will need its ` +
        `correctIndex filled in by hand before it can be imported.`
    );
  } else if (markerUnreliable) {
    console.log(
      `\n⚠️  The correct-answer marker in this file looks unreliable (heavily skewed toward one option ` +
        `across ${withKey} questions) — deriving answers from each question's explanation text via Groq ` +
        `instead of trusting the marker. Every result is flagged low-confidence for review regardless.`
    );
  }

  const results: ExtractedQuestion[] = [];
  for (const [i, q] of parsed.entries()) {
    const num = i + 1;
    let prompt = q.prompt;
    let options = q.options;
    let correctIndex = q.correctIndex;
    let explanation = q.explanation;
    let confidence: 'high' | 'low' = q.confidence;
    let note = q.note;

    const structurallyBroken = !prompt || options.length < 2;
    if (structurallyBroken) {
      process.stdout.write(`  question ${num}: couldn't parse prompt/options, trying Groq reconstruction... `);
      const fixed = await reconstructFromRawText(q.rawText);
      if (fixed && fixed.prompt && fixed.options && fixed.options.length >= 2) {
        prompt = fixed.prompt;
        options = fixed.options;
        correctIndex = fixed.correctIndex ?? -1;
        explanation = fixed.explanation || '';
        confidence = 'low';
        console.log('recovered (still needs review)');
      } else {
        console.log('could not recover — skipping (not a real question block, or too garbled)');
        continue;
      }
    }

    const perQuestionContradiction =
      !fileHasNoKey && !markerUnreliable && correctIndex >= 0 && explanationContradictsAnswer(explanation, correctIndex);

    if ((markerUnreliable || perQuestionContradiction) && !structurallyBroken) {
      if (explanation) {
        process.stdout.write(`  question ${num}: deriving answer from explanation... `);
        const derived = await deriveAnswerFromExplanation(prompt, options, explanation);
        if (derived !== null && derived >= 0) {
          correctIndex = derived;
          confidence = 'low';
          note = 'Correct-answer marker for this file is unreliable — this answer was derived from the explanation text via Groq, not transcribed. Verify by hand.';
          console.log('done');
        } else {
          correctIndex = -1;
          confidence = 'low';
          note = "Correct-answer marker for this file is unreliable, and the explanation didn't clearly indicate the right option either — needs manual answer-key entry.";
          console.log('unclear — flagged for manual entry');
        }
      } else {
        correctIndex = -1;
        confidence = 'low';
        note = 'Correct-answer marker for this file is unreliable and there is no explanation to derive from — needs manual answer-key entry.';
      }
    }

    let explanationSource: 'transcribed' | 'generated' = 'transcribed';
    if (!explanation && correctIndex >= 0) {
      process.stdout.write(`  question ${num}: no explanation in source, generating one... `);
      try {
        explanation = await generateExplanation(prompt, options, correctIndex);
        explanationSource = 'generated';
        console.log('done');
      } catch (err) {
        console.log(`failed (${(err as Error).message})`);
      }
    }

    try {
      results.push(
        ExtractedQuestionSchema.parse({
          prompt,
          options,
          correctIndex,
          explanation: explanation || '(no explanation available — fill in manually before import)',
          explanationSource,
          confidence: correctIndex >= 0 ? confidence : 'low',
          sourcePage: num,
          reviewed: false,
          ...(note && { note }),
        })
      );
    } catch (err) {
      // One malformed block (e.g. two questions merged into one — seen for real
      // on a reading-comprehension exam where a missed question-boundary produced
      // 7+ "options") shouldn't lose every other question's progress in the batch.
      // Skipped, not silently coerced — this needs a look at the source, not a guess.
      console.log(`  question ${num}: skipped — failed validation (${(err as Error).message.split('\n')[0]})`);
    }
  }

  const outPath = out ? resolve(out) : resolve(__dirname, `output/${subject}-${year}.json`);
  await mkdir(resolve(outPath, '..'), { recursive: true });
  await writeFile(outPath, JSON.stringify(results, null, 2));

  const lowConfidence = results.filter((r) => r.confidence === 'low').length;
  const noKey = results.filter((r) => r.correctIndex < 0).length;
  const generated = results.filter((r) => r.explanationSource === 'generated').length;
  const derived = results.filter((r) => r.note?.includes('derived from the explanation')).length;
  console.log(`\nWrote ${results.length} question(s) to ${outPath}`);
  console.log(`  ${lowConfidence} low-confidence, ${noKey} missing an answer key, ${generated} with a generated explanation.`);
  if (derived > 0) console.log(`  ${derived} with an answer derived from the explanation (unreliable marker) — check these.`);
  console.log(`  All entries have reviewed:false — review the file, then run ingest:import.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
