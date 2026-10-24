// Converts the Kehulum scrape (see ~/Downloads/kehulum-euee-questions, produced by
// a one-off scraper, not part of this repo) into the same reviewable JSON shape
// extractExam.ts produces — so it goes through the exact same human-review gate
// in importReviewed.ts before anything reaches Postgres.
//
// Only emits questions Kehulum itself displayed a "Correct Answer is (X)" marker
// for — the ExtractedQuestion schema requires a real correctIndex, and the vast
// majority of the scrape has no marker at all (crowdsourced explanations that
// haven't been filled in yet). Those are simply not convertible right now; they'd
// need a separate answer-key source before they could become real Question rows.
//
// Usage:
//   npm run ingest:kehulum
//
// Then, per output file:
//   npm run ingest:import -- --questions ./scripts/ingest/output/english-2025-natural.json --subject english --year 2025 --stream natural
import { readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { ExtractedQuestion, ExtractedQuestionSchema } from './schemas';

const SOURCE_ROOT = join(homedir(), 'Downloads', 'kehulum-euee-questions');
const OUT_DIR = resolve(__dirname, 'output');

// Answers worked out independently for questions the scrape left unkeyed,
// keyed by sha1 of the exact prompt. Without this a re-import would silently
// revert them to unscored.
const MANUAL_ANSWERS: Record<string, number> = JSON.parse(
  readFileSync(join(__dirname, 'manual-answers.json'), 'utf-8')
);

const TRACK_TO_STREAM: Record<string, 'natural' | 'social'> = {
  'natural-science': 'natural',
  'social-science': 'social',
};

// Kehulum's subject slug -> this app's Subject.slug. Regional variants
// (tigray-region-*) aren't mapped — skipped deliberately, see main() below.
const SUBJECT_SLUG_MAP: Record<string, string> = {
  biology: 'biology',
  chemistry: 'chemistry',
  'civics-and-ethical-education': 'civics',
  english: 'english',
  mathematics: 'mathematics',
  physics: 'physics',
  'scholastic-aptitude-test': 'aptitude',
  geography: 'geography',
  history: 'history',
  economics: 'economics',
};

type KehulumQuestion = {
  number: number;
  question: string;
  choices: Record<string, string>;
  correct_answer: string | null;
  explanation: string | null;
};
type KehulumFile = {
  track: string;
  ec_year: number;
  gc_year: number;
  subject: string;
  source: string;
  questions: KehulumQuestion[];
};

function toExtractedQuestion(q: KehulumQuestion, source: string): ExtractedQuestion | null {
  const letters = Object.keys(q.choices).sort();
  const options = letters.map((l) => q.choices[l]);
  // Image-only questions reach the scrape with empty choice text; they cannot be
  // rendered as text options, so they stay out rather than import as blanks.
  if (options.length < 2 || options.some((o) => !String(o || '').trim())) return null;
  // Questions the scrape published without an answer are still imported — with
  // correctIndex -1 → NULL in the database — so students can read them; they are
  // simply never scored. A separately derived answer (manual-answers.json) takes
  // precedence over "unscored" when one exists for this exact prompt.
  const manualIndex = MANUAL_ANSWERS[createHash('sha1').update(q.question).digest('hex')];
  const scrapedIndex = q.correct_answer ? letters.indexOf(q.correct_answer.toUpperCase()) : -1;
  const usingManual = scrapedIndex < 0 && manualIndex !== undefined;
  const candidate = scrapedIndex >= 0 ? scrapedIndex : (manualIndex ?? -1);
  const correctIndex = candidate >= 0 && candidate < options.length ? candidate : -1;
  // Kehulum's own "Correct Answer is (X)" marker is the source's published key
  // → official. manual-answers.json entries were worked out independently
  // (by a person or a model) because the source had no marker → derived.
  const answerSource = correctIndex === -1 ? undefined : usingManual ? 'derived' : 'official';

  return ExtractedQuestionSchema.parse({
    prompt: q.question,
    options,
    correctIndex,
    answerSource,
    explanation: q.explanation || '(no explanation available — the source published this question without one)',
    explanationSource: 'transcribed',
    confidence: correctIndex >= 0 ? 'high' : 'low',
    sourcePage: q.number,
    reviewed: false,
    note:
      `Scraped from ${source} (question ${q.number})` +
      (correctIndex >= 0 ? ' — spot-check against the source page before flipping reviewed:true.' : ' — no answer key in the source; imported unscored.'),
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let filesRead = 0;
  let filesWritten = 0;
  let questionsIn = 0;
  let questionsOut = 0;
  let questionsAnswered = 0;
  let subjectsSkipped = new Set<string>();

  for (const track of Object.keys(TRACK_TO_STREAM)) {
    const trackDir = join(SOURCE_ROOT, track);
    let years: string[];
    try {
      years = await readdir(trackDir);
    } catch {
      continue;
    }
    for (const year of years) {
      const yearDir = join(trackDir, year);
      const files = await readdir(yearDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        filesRead += 1;
        const raw: KehulumFile = JSON.parse(await readFile(join(yearDir, file), 'utf-8'));
        questionsIn += raw.questions.length;

        const appSlug = SUBJECT_SLUG_MAP[raw.subject];
        if (!appSlug) {
          subjectsSkipped.add(raw.subject);
          continue;
        }

        const converted = raw.questions
          .map((q) => toExtractedQuestion(q, raw.source))
          .filter((q): q is ExtractedQuestion => q !== null);
        if (converted.length === 0) continue;

        const stream = TRACK_TO_STREAM[track];
        const outPath = join(OUT_DIR, `${appSlug}-${raw.gc_year}-${stream}.json`);
        await writeFile(outPath, JSON.stringify(converted, null, 2));
        filesWritten += 1;
        questionsOut += converted.length;
        const answered = converted.filter((q) => q.correctIndex >= 0).length;
        questionsAnswered += answered;
        console.log(
          `${appSlug}-${raw.gc_year}-${stream}.json: wrote ${converted.length}/${raw.questions.length} question(s) ` +
            `(${answered} with a real answer, ${converted.length - answered} unscored)`
        );
      }
    }
  }

  console.log(`\nRead ${filesRead} source file(s), ${questionsIn} question(s) total.`);
  console.log(
    `Wrote ${filesWritten} output file(s), ${questionsOut} question(s) total — ${questionsAnswered} with a real answer, ` +
      `${questionsOut - questionsAnswered} imported unscored (no answer key in the source).`
  );
  if (subjectsSkipped.size > 0) {
    console.log(`Skipped subject(s) with no app-side mapping: ${[...subjectsSkipped].join(', ')}`);
  }
  console.log(`\nAll entries have reviewed:false — review each file, then run ingest:import (see this file's header for the command).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
