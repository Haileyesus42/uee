import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { extractJsonFromText } from './groq';

const prisma = new PrismaClient();
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Accept either GEMINI_API_KEYS (comma-separated, preferred for 4-key rotation)
// or GEMINI_API_KEY (single). Falls through to Groq if neither is set.
const KEYS = (
  process.env.GEMINI_API_KEYS ??
  process.env.GEMINI_API_KEY ??
  ''
)
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

const GROQ_KEY = process.env.GROQ_API_KEY;
const BACKEND: 'gemini' | 'groq' = KEYS.length > 0 ? 'gemini' : GROQ_KEY ? 'groq' : (() => {
  throw new Error('Set GEMINI_API_KEYS (comma-separated) or GROQ_API_KEY');
})();

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const PAUSE_MS = BACKEND === 'gemini' ? 4500 : 2100;

// --- Gemini key rotation state ---
let currentKeyIdx = 0;
const deadKeys = new Set<number>();

function nextLiveKey(): number {
  while (currentKeyIdx < KEYS.length && deadKeys.has(currentKeyIdx)) {
    currentKeyIdx++;
  }
  return currentKeyIdx;
}

function parseWithRepair(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Gemini writes LaTeX like \pi, \frac, \sqrt inside JSON string values
    // without doubling the backslash. JSON.parse then fails on \p, \f, \s
    // (not valid JSON escapes). Repair: escape any backslash that isn't
    // already part of a valid escape (\", \\, \/, \b, \f, \n, \r, \t, \uXXXX),
    // then retry the parse.
    let repaired = text.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    // \u alone isn't valid JSON — it requires 4 hex digits. LaTeX commands
    // like \underline, \underbrace, \uparrow start with \u followed by
    // letters, which JSON.parse rejects. Fix by escaping \u when not
    // followed by 4 hex chars.
    repaired = repaired.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');
    return JSON.parse(repaired);
  }
}

async function geminiJson(prompt: string): Promise<unknown> {
  const idx = nextLiveKey();
  if (idx >= KEYS.length) {
    throw new Error('ALL_KEYS_EXHAUSTED');
  }

  const key = KEYS[idx];
  const keyLabel = `[key ${idx + 1}/${KEYS.length}]`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  });

  if (res.status === 429) {
    console.warn(`  ⚠️  ${keyLabel} quota exhausted — rotating to next key`);
    deadKeys.add(idx);
    currentKeyIdx = idx + 1;
    // Retry the same prompt with the next key
    return geminiJson(prompt);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status} ${keyLabel}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini returned no content ${keyLabel}`);
  return parseWithRepair(text);
}

async function callBackend(prompt: string): Promise<unknown> {
  return BACKEND === 'gemini' ? geminiJson(prompt) : extractJsonFromText(prompt, GROQ_MODEL);
}

function buildPromptWithKey(q: {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subjectName: string;
}): string {
  const cl = LETTERS[q.correctIndex];
  return `You are an expert UEE tutor. A student tapped "Ask Unity" for a deeper explanation.

Question (${q.subjectName}): ${q.prompt}

Options:
${q.options.map((o, i) => `${LETTERS[i]}. ${o}`).join('\n')}

Correct answer: ${cl}. ${q.options[q.correctIndex]}
Short explanation already shown: ${q.explanation}

Return JSON only:
{
  "explanation": "<280-360 words. Use **bold** section labels exactly as shown. Do NOT use # headers or code blocks. Structure:

**Why ${cl} is correct:**
Step-by-step derivation using the actual numbers.

**Why the others are wrong:**
- Option X: reason
- Option Y: reason
(one dash-bullet per wrong option)

**The concept you need:**
The underlying formula or principle.

**Common trap:**
What students typically get wrong.>",
  "followUps": [{ "q": "...", "a": "..." }, ...4 total...]
}

Explanation must cover: Why ${cl} is correct (step by step). Why the others are wrong (one sentence each). The formula/concept needed. Common trap. Use the actual numbers.

Follow-ups must be specific to THIS question. Answers under 80 words.`;
}

function buildPromptNoKey(q: {
  prompt: string;
  options: string[];
  explanation: string;
  subjectName: string;
}): string {
  return `You are an expert UEE tutor. A student tapped "Ask Unity" for a deeper explanation. The source paper did NOT publish an answer key — determine the correct answer yourself first, then explain.

Question (${q.subjectName}): ${q.prompt}

Options:
${q.options.map((o, i) => `${LETTERS[i]}. ${o}`).join('\n')}

Existing short explanation: ${q.explanation || '(none)'}

Return JSON only:
{
  "determinedAnswerIndex": <0-based index of the correct option>,
  "determinedAnswerReasoning": "<1-2 sentences justifying your choice>",
  "explanation": "<280-360 words. Use **bold** section labels exactly as shown. Do NOT use # headers or code blocks. Structure:

Based on the content, [LETTER] is the most likely answer. Here is why:

**Why [LETTER] is correct:**
Step-by-step derivation using the actual numbers.

**Why the others are wrong:**
- Option X: reason
- Option Y: reason

**The concept you need:**
The underlying formula or principle.

**Common trap:**
What students typically get wrong.>",
  "followUps": [{ "q": "...", "a": "..." }, ...4 total...]
}

Follow-ups must be specific to THIS question. Answers under 80 words.`;
}

function validate(raw: unknown, hasKey: boolean) {
  if (typeof raw !== 'object' || raw === null) throw new Error('Not an object');
  const r = raw as Record<string, unknown>;
  if (typeof r.explanation !== 'string' || r.explanation.length < 100)
    throw new Error('Missing or short explanation');
  if (!Array.isArray(r.followUps)) throw new Error('Missing followUps');

  const followUps = (r.followUps as unknown[])
    .filter(
      (f): f is { q: string; a: string } =>
        typeof f === 'object' &&
        f !== null &&
        typeof (f as any).q === 'string' &&
        typeof (f as any).a === 'string',
    )
    .slice(0, 4);

  if (hasKey) return { explanation: r.explanation as string, followUps };

  if (
    typeof r.determinedAnswerIndex !== 'number' ||
    r.determinedAnswerIndex < 0 ||
    r.determinedAnswerIndex > 4
  ) {
    throw new Error('Missing/invalid determinedAnswerIndex');
  }
  return {
    explanation: r.explanation as string,
    followUps,
    determinedAnswerIndex: r.determinedAnswerIndex,
    determinedAnswerReasoning:
      typeof r.determinedAnswerReasoning === 'string' ? r.determinedAnswerReasoning : '',
  };
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit')
    ? Number(args[args.indexOf('--limit') + 1])
    : undefined;
  const dryRun = args.includes('--dry-run');
  const noKeyOnly = args.includes('--no-key-only');
  const withKeyOnly = args.includes('--with-key-only');

  const questions = await prisma.question.findMany({
    where: {
      aiDeepExplanation: null,
      ...(noKeyOnly && { correctIndex: null }),
      ...(withKeyOnly && { correctIndex: { not: null } }),
    },
    include: { subject: true },
    orderBy: { id: 'asc' },
    take: limit,
  });

  console.log(`Backend: ${BACKEND}`);
  if (BACKEND === 'gemini') {
    console.log(`Model: ${GEMINI_MODEL} | Keys: ${KEYS.length} | Pause: ${PAUSE_MS}ms`);
  } else {
    console.log(`Model: ${GROQ_MODEL} | Pause: ${PAUSE_MS}ms`);
  }
  console.log(`To process: ${questions.length}${dryRun ? ' (dry run)' : ''}\n`);
  if (questions.length === 0) {
    console.log('Nothing to do. All questions already backfilled.');
    return;
  }

  const start = Date.now();
  let ok = 0;
  let failed = 0;
  let noKeyDetermined = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const options = q.options as string[];
    const hasKey = q.correctIndex !== null;

    try {
      const prompt = hasKey
        ? buildPromptWithKey({
            prompt: q.prompt,
            options,
            correctIndex: q.correctIndex!,
            explanation: q.explanation,
            subjectName: q.subject.name,
          })
        : buildPromptNoKey({
            prompt: q.prompt,
            options,
            explanation: q.explanation,
            subjectName: q.subject.name,
          });

      const raw = await callBackend(prompt);
      const result = validate(raw, hasKey);

      if (!dryRun) {
        await prisma.question.update({
          where: { id: q.id },
          data: {
            aiDeepExplanation: result.explanation,
            aiDeepExplanationAt: new Date(),
            aiFollowUps: result.followUps,
            aiFollowUpsAt: new Date(),
          },
        });
      }
      ok += 1;

      if (!hasKey && result.determinedAnswerIndex !== undefined) {
        noKeyDetermined += 1;
        console.log(
          `  ℹ️  no-key: AI said ${LETTERS[result.determinedAnswerIndex]} — ${result.determinedAnswerReasoning?.slice(0, 90)}`,
        );
      }

      const elapsed = (Date.now() - start) / 1000;
      const rate = ok / elapsed;
      const etaMin = rate > 0 ? Math.ceil((questions.length - i - 1) / rate / 60) : 0;
      const keyNow = BACKEND === 'gemini' ? ` (k${currentKeyIdx + 1}/${KEYS.length})` : '';
      console.log(
        `✓ [${i + 1}/${questions.length}] ${q.id.slice(0, 8)}… ${q.subject.slug}${keyNow} — ETA ${etaMin}m`,
      );

      if (dryRun && i === 0) {
        console.log('\n--- Sample output ---\n');
        console.log(result.explanation);
        console.log('\nFollow-ups:');
        for (const f of result.followUps) console.log(`  Q: ${f.q}\n  A: ${f.a}\n`);
        console.log('--- End sample ---\n');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg === 'ALL_KEYS_EXHAUSTED') {
        console.error('\n🛑 All Gemini keys exhausted. Run again tomorrow.');
        console.error(`Progress: ${ok} ok, ${failed} failed, ${questions.length - i} not attempted.`);
        break;
      }

      failed += 1;
      console.error(`✗ [${i + 1}/${questions.length}] ${q.id.slice(0, 8)}…: ${msg.slice(0, 200)}`);

      const quotaHit = msg.includes('429') || msg.toLowerCase().includes('quota');
      if (quotaHit) {
        console.error('\nQuota exhausted. Run again tomorrow — it will pick up where it left off.');
        break;
      }
    }

    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }

  const remaining = await prisma.question.count({ where: { aiDeepExplanation: null } });
  console.log(`\nDone: ${ok} ok, ${failed} failed, ${noKeyDetermined} AI-determined.`);
  console.log(`Elapsed: ${Math.round((Date.now() - start) / 60000)}m. Remaining: ${remaining}.`);
  if (BACKEND === 'gemini') {
    console.log(`Keys used: ${deadKeys.size} of ${KEYS.length} exhausted this run.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
