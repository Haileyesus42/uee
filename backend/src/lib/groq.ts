import { env } from '../env';

// Live counterpart to scripts/ingest/groq.ts — that one is for the offline
// ingestion pipeline (json_object mode, temperature 0, deterministic extraction).
// This one is for Unity's actual conversation: freeform text, a warmer
// temperature, and a hard maxTokens ceiling passed in by the caller (see
// modules/chat/routes.ts) rather than baked in here, since the cap is a cost
// policy decision that belongs with the route, not the provider client.
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type GroqChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function groqChat(messages: GroqChatMessage[], maxTokens: number): Promise<string> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set — add it to backend/.env to enable Unity chat.');
  }

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.GROQ_TEXT_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq chat request failed (${res.status}): ${body}`);
  }

  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');
  return content;
}
