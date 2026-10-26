// Generates explanations for weak/missing-explanation questions, one Claude
// call per question. The model picks its own answer from prompt+options alone
// — it is never told the stored correctIndex — and that independent pick is
// what gets compared against it. Only a match produces a written explanation;
// a mismatch is flagged for human review instead of forced to fit. This
// writes a reviewable JSON file only — see applyExplanations.ts for the
// separate, review-gated step that actually writes to the database. Mirrors
// the extractPastPaper.ts -> manual review -> importReviewed.ts shape already
// used elsewhere in this project.
//
// Usage:
//   npm run explain:generate -- --subject mathematics --limit 50
//   npm run explain:generate -- --subject english --year 2025 --limit 50
//   npm run explain:generate -- --limit 100   (any subject/year)
//
// Resumable: re-running the same --subject/--year (same default --out path)
// skips questions already present in the output file and only processes the
// rest, so a batch can be stopped and picked back up.
import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const client = new Anthropic();

const MODEL = 'claude-sonnet-5-5';

// Same heuristic used in the audit and the pilot forks.
const ANSWER_PREFIX =
  /^(correct answer is|the answer is|answer\s*[:\-]|option\s*\(?[a-d]\)?\s*is\s*correct|\(?[a-d]\)?\s*is\s*(the\s*)?correct)/i;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function isWeak(explanation: string): boolean {
  const trimmed = explanation.trim();
  if (trimmed.length === 0 || trimmed.startsWith('(no explanation available')) return true;
  const words = wordCount(trimmed);
  if (ANSWER_PREFIX.test(trimmed) && words <= 15) return true;
  if (words <= 6) return true;
  return false;
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

type ResultRow = {
  id: string;
  subject: string;
  examYear: number | null;
  stream: string | null;
  prompt: string;
  options: string[];
  correctIndex: number | null;
  oldExplanation: string;
  verified: boolean;
  modelAnswerIndex: number | null;
  newExplanation: string | null;
  note: string;
};

async function solveAndExplain(subject: string, prompt: string, options: string[]) {
  const lettered = options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n');
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      'You are an expert UEE (Ethiopian University Entrance Exam) tutor writing explanations for a study app. ' +
      'Solve each question yourself from the prompt and options alone before responding. Respond with ONLY a JSON ' +
      'object, no other text: {"answerIndex": <0-based index of the option you believe is correct>, ' +
      '"explanation": "<2-4 sentence explanation of WHY that answer is correct, written for a student reviewing ' +
      'this question — the underlying concept or method, not a restatement of the letter. Where it adds real ' +
      'value cheaply, note why one tempting wrong option fails. Use $...$ LaTeX delimiters for any math notation, ' +
      'matching how the question itself is formatted. Keep legitimately short explanations short (e.g. a single ' +
      'vocabulary definition) rather than padding them.>"}',
    messages: [{ role: 'user', content: `Subject: ${subject}\n\nQuestion: ${prompt}\n\n${lettered}` }],
  });

  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('No text content in response');

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON found in response: ${text.text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as { answerIndex: number; explanation: string };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const limit = args.limit ? Number(args.limit) : 50;

  const questions = await prisma.question.findMany({
    where: {
      examYear: { not: null },
      ...(args.subject ? { subject: { slug: args.subject } } : {}),
      ...(args.year ? { examYear: Number(args.year) } : {}),
    },
    select: {
      id: true,
      prompt: true,
      options: true,
      correctIndex: true,
      explanation: true,
      examYear: true,
      stream: true,
      subject: { select: { slug: true } },
    },
  });

  const weak = questions.filter((q) => isWeak(q.explanation));
  console.log(`${weak.length} weak question(s) match the filter (of ${questions.length} total).`);

  const outDir = resolve(__dirname, 'output');
  await mkdir(outDir, { recursive: true });
  const outPath = resolve(outDir, args.out ?? `generated-${args.subject ?? 'all'}-${args.year ?? 'any'}.json`);

  let results: ResultRow[] = [];
  try {
    results = JSON.parse(await readFile(outPath, 'utf-8'));
  } catch {
    results = [];
  }
  const alreadyDone = new Set(results.map((r) => r.id));

  const batch = weak.filter((q) => !alreadyDone.has(q.id)).slice(0, limit);
  console.log(`${alreadyDone.size} already done in ${outPath}, processing ${batch.length} more this run.`);

  let verified = 0;
  let flagged = 0;

  for (const [i, q] of batch.entries()) {
    process.stdout.write(`  ${i + 1}/${batch.length} (${q.subject.slug} ${q.examYear})... `);

    const base = {
      id: q.id,
      subject: q.subject.slug,
      examYear: q.examYear,
      stream: q.stream,
      prompt: q.prompt,
      options: q.options as string[],
      correctIndex: q.correctIndex,
      oldExplanation: q.explanation,
    };

    try {
      const { answerIndex, explanation } = await solveAndExplain(q.subject.slug, q.prompt, q.options as string[]);
      const isMatch = q.correctIndex !== null && answerIndex === q.correctIndex;

      results.push({
        ...base,
        verified: isMatch,
        modelAnswerIndex: answerIndex,
        newExplanation: isMatch ? explanation : null,
        note: isMatch
          ? ''
          : `Model's independent answer (${answerIndex}) did not match stored correctIndex (${q.correctIndex}) — flagged, not written.`,
      });

      if (isMatch) {
        verified += 1;
        console.log('verified');
      } else {
        flagged += 1;
        console.log('FLAGGED (answer mismatch)');
      }
    } catch (err) {
      flagged += 1;
      results.push({
        ...base,
        verified: false,
        modelAnswerIndex: null,
        newExplanation: null,
        note: `Error: ${(err as Error).message}`,
      });
      console.log('ERROR');
    }

    // Persist after every question, not just at the end, so an interrupt
    // never loses more than one question's work.
    await writeFile(outPath, JSON.stringify(results, null, 2));
  }

  console.log(`\nWrote ${results.length} total result(s) to ${outPath}`);
  console.log(`  This run: ${verified} verified, ${flagged} flagged.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
