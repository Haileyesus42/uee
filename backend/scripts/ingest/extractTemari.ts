// Extracts a past paper from Temari.et, whose pages publish a *text* answer
// key ("MARKING KEY") as a PDF — unlike the MoE scans in
// ~/Downloads/ethiopian-national-exams, which are image-only and unusable
// without OCR on this host.
//
// The key PDF carries the whole paper: question text, options A–D in their
// original order (the correct one prefixed with ✓), the "Answer: X" line and a
// written explanation. That makes it a self-consistent source — the answer can
// never drift from the question — so no answer-key overlay is needed.
//
// Usage:
//   npx tsx scripts/ingest/extractTemari.ts \
//     --paper grade-12-aptitude-2015 --subject aptitude --year 2023 --stream natural
//
// Output is review-gated JSON in the same shape importReviewed.ts accepts.
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PAPER_BASE = 'https://temari.et/exam-prep/papers';
const INPUT_DIR = resolve(__dirname, 'input/temari');
const OUT_DIR = resolve(__dirname, 'output');

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!args.paper || !args.subject || !args.year) {
    throw new Error('Usage: --paper <slug> --subject <slug> --year <gregorian> [--stream natural|social]');
  }
  return {
    paper: args.paper,
    subject: args.subject,
    year: Number(args.year),
    stream: (args.stream ?? 'natural') as 'natural' | 'social',
  };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' } });
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return res.text();
}

// The paper page links both the question paper and the marking key; only the
// key carries the answers, and it is also the more complete document.
async function findKeyPdf(slug: string): Promise<string> {
  const html = await fetchText(`${PAPER_BASE}/${slug}`);
  const pdfs = [...html.matchAll(/https:\/\/content\.temari\.et\/[^"']+\.pdf/g)].map((m) => m[0]);
  const key = pdfs.find((u) => /answer-key/i.test(u));
  if (!key) throw new Error(`no answer key linked from ${PAPER_BASE}/${slug} (found ${pdfs.length} pdfs)`);
  return key;
}

async function download(url: string, dest: string): Promise<void> {
  try {
    const s = await stat(dest);
    if (s.size > 20_000) return;
  } catch {
    // not cached yet
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' } });
  if (!res.ok) throw new Error(`${res.status} downloading ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

type Parsed = { prompt: string; options: string[]; correctIndex: number; explanation: string };

// Layout of one question in the —layout text:
//
//   12.  Question text                                    (1)
//        A. option        B. option
//        C. ✓ correct     D. option
//          Answer: C
//          Explanation text, possibly wrapped over several lines.
//
// Split on the "Answer: X" lines, NOT on question numbers: a stem whose leading
// "12." isn't at column 0 (stacked fractions, tables) used to be skipped
// entirely, which is how grade-12-mathematics-2014 yielded 23 of 51. The number
// is still used, but only to trim the previous question's explanation.
function parseKey(text: string): Parsed[] {
  const answers = [...text.matchAll(/Answer:\s*([A-D])\b/g)].map((m) => ({
    letter: m[1],
    start: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
  }));
  if (answers.length === 0) return [];

  // Where each question begins: the numbered line inside the block that closes
  // at this answer, falling back to the block start when no number was found.
  const questionStarts = answers.map((a, i) => {
    const from = i === 0 ? 0 : answers[i - 1].end;
    const segment = text.slice(from, a.start);
    const numbered = [...segment.matchAll(/^[ \t]*(\d{1,3})\.[ \t]+\S/gm)];
    if (numbered.length === 0) return from;
    const own = numbered.find((m) => Number(m[1]) === i + 1);
    const chosen = own ?? numbered[numbered.length - 1];
    return from + (chosen.index ?? 0);
  });

  const labels = ['A', 'B', 'C', 'D'];
  const out: Parsed[] = [];

  for (let i = 0; i < answers.length; i += 1) {
    const body = text.slice(questionStarts[i], answers[i].start).replace(/^\s+/, '');
    if (!body.trim()) continue;

    // Options live after the first (numbered) line and may share a line in two
    // columns, so they are split on the label rather than on newlines.
    const newline = body.indexOf('\n');
    const optionsPart = newline === -1 ? '' : body.slice(newline + 1);
    const parts = optionsPart.split(/(?:^|\s)([A-D])\.\s+/).slice(1);
    const options: Record<string, string> = {};
    for (let p = 0; p + 1 < parts.length; p += 2) {
      const label = parts[p];
      const value = parts[p + 1]
        .replace(/\(1\)\s*$/, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*✓\s*/g, ' ')
        .trim();
      if (!options[label]) options[label] = value;
    }
    if (labels.some((l) => !options[l])) continue;

    const prompt = body
      .slice(0, newline === -1 ? body.length : newline)
      .replace(/^\s*\d{1,3}\.\s+/, '')
      .replace(/\(1\)\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!prompt) continue;

    const explanationEnd = i + 1 < answers.length ? questionStarts[i + 1] : text.length;
    const explanation = text
      .slice(answers[i].end, explanationEnd)
      .replace(/\s+/g, ' ')
      .trim();

    out.push({
      prompt,
      options: labels.map((l) => options[l]),
      correctIndex: labels.indexOf(answers[i].letter),
      explanation,
    });
  }
  return out;
}

async function main() {
  const { paper, subject, year, stream } = parseArgs(process.argv.slice(2));
  await mkdir(INPUT_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const keyUrl = await findKeyPdf(paper);
  const pdfPath = join(INPUT_DIR, `${paper}.pdf`);
  await download(keyUrl, pdfPath);

  const { stdout } = await execFileAsync('pdftotext', ['-layout', pdfPath, '-'], { maxBuffer: 32 * 1024 * 1024 });
  const parsed = parseKey(stdout);

  const declared = stdout.match(/Questions:\s*(\d+)/);
  const expectedCount = declared ? Number(declared[1]) : null;

  const questions = parsed.map((q) => ({
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation || '(no explanation in the marking key)',
    explanationSource: q.explanation ? 'transcribed' : 'generated',
    confidence: 'high',
    reviewed: false,
    note: `Temari.et marking key (${keyUrl}) — verify against the paper before flipping reviewed:true.`,
  }));

  const outPath = join(OUT_DIR, `temari-${paper}.json`);
  await writeFile(outPath, JSON.stringify(questions, null, 2));

  console.log(`${paper}: parsed ${questions.length} question(s)` + (expectedCount ? ` of ${expectedCount} declared` : ''));
  if (!questions.length) process.exit(1);
  console.log(`-> ${outPath}`);
  console.log(
    `Import with: npm run ingest:import -- --questions ./scripts/ingest/output/temari-${paper}.json ` +
      `--subject ${subject} --year ${year} --stream ${stream}`
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
