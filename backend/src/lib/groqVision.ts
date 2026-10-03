import { env } from '../env';

// Runtime counterpart to scripts/ingest/groq.ts's extractJsonFromImage — same Groq
// vision contract, but takes an in-memory buffer (an HTTP upload) rather than a
// path on disk, since the ingest scripts' version only ever reads local files and
// this lives in src/ (scripts/ingest imports from src/, not the other way around).
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same retry behavior as the ingest scripts' client — Groq's free tier returns 429s
// under even light concurrent load, and a student tapping "upload" twice shouldn't
// surface that as a hard failure.
async function fetchGroqWithRetry(body: unknown, maxRetries = 3): Promise<Response> {
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

export async function extractJsonFromImageBuffer(image: Buffer, contentType: string, prompt: string): Promise<unknown> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set — Telebirr screenshot verification is unavailable.');
  }

  const dataUrl = `data:${contentType};base64,${image.toString('base64')}`;

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
    throw new Error(`Groq request failed (${res.status}): ${body}`);
  }

  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Groq response wasn't valid JSON:\n${content}`);
  }
}
