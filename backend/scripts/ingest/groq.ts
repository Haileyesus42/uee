import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { env } from '../../src/env';

// Plain fetch against Groq's OpenAI-compatible REST endpoint rather than an SDK —
// the request shape is a stable, documented contract (console.groq.com/docs/api-reference)
// and doesn't depend on trusting a specific package version's method names.
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Groq's free/on-demand tier has a low requests-per-minute cap (seen: 30 RPM)
// that a batch of ~100 sequential per-question calls blows through easily. Retries
// on 429 using the delay the API itself reports (falls back to a fixed 2s if the
// message doesn't include one) rather than failing the whole item outright.
async function fetchGroqWithRetry(body: unknown, maxRetries = 5): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.status !== 429 || attempt >= maxRetries) return res;
    const text = await res.clone().text();
    const match = text.match(/try again in ([\d.]+)s/i);
    const waitMs = match ? Math.ceil(Number(match[1]) * 1000) + 250 : 2000;
    await sleep(waitMs);
  }
}

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export async function imageToDataUrl(path: string): Promise<string> {
  const ext = extname(path).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) throw new Error(`Unsupported image type "${ext}" for ${path} — use png/jpg/webp`);
  const bytes = await readFile(path);
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

// Asks the vision model for a page's content as raw JSON text (response_format:
// json_object), then JSON.parses it. Schema validation happens one layer up, in the
// extract scripts, so a shape mismatch is reported per-file rather than crashing the
// whole batch.
export async function extractJsonFromImage(imagePath: string, prompt: string): Promise<unknown> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set — add it to backend/.env before running ingestion.');
  }
  const dataUrl = await imageToDataUrl(imagePath);

  const res = await fetchGroqWithRetry({
    model: env.GROQ_VISION_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq request failed (${res.status}) for ${imagePath}: ${body}`);
  }

  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Groq returned no content for ${imagePath}`);

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Groq response for ${imagePath} wasn't valid JSON:\n${content}`);
  }
}

// Text-only counterpart to extractJsonFromImage — no image, cheaper, used for
// structuring textbook prose into lesson steps and as a fallback for exam
// questions the deterministic parser (parseExamText.ts) couldn't confidently
// handle. Uses GROQ_TEXT_MODEL, a separate (typically larger/smarter, since
// there's no vision-token cost to offset) model from GROQ_VISION_MODEL.
export async function extractJsonFromText(prompt: string, model: string): Promise<unknown> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set — add it to backend/.env before running ingestion.');
  }

  const res = await fetchGroqWithRetry({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq text request failed (${res.status}): ${body}`);
  }

  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Groq text response wasn't valid JSON:\n${content}`);
  }
}
