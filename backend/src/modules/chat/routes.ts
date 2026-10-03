import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { groqChat, GroqChatMessage } from '../../lib/groq';
import { authenticate } from '../../plugins/authenticate';

// Hard ceiling on every Groq call's *response* — passed straight through as
// max_tokens, so Groq itself stops generation there rather than us truncating
// after the fact (docs/backend-architecture.md §9: token cost is the one thing
// in this stack that scales directly with usage).
const MAX_RESPONSE_TOKENS = 400;
// Ceiling on the *request* side too — a guardrail only on the reply half would
// still let one long paste dominate the token bill. ~4 chars/token is a rough
// but standard heuristic for English text; this doesn't need to be exact, just
// to keep any single message in the same ballpark as MAX_RESPONSE_TOKENS.
const MAX_INPUT_CHARS = MAX_RESPONSE_TOKENS * 4;
// Free-tier cap on real LLM calls per user per day (Compass Pro is unlimited —
// see isProUser below). This is the "5/day free" example from
// docs/backend-architecture.md §9 — the full Tier 0-3 retrieval/cache system
// that doc describes (pgvector, Redis response cache, spend counter) is Phase 2
// scope; this route calls the LLM directly every time, so the daily cap is the
// only cost governor in place until that's built.
const DAILY_FREE_LIMIT = 5;
// How much prior conversation rides along with each call — bounded, not the
// full history, for the same token-cost reason (§9 point 2).
const HISTORY_WINDOW = 10;

const SYSTEM_PROMPT =
  'You are Unity, a friendly and encouraging AI tutor inside Compass, an app helping Ethiopian grade 9-12 ' +
  'students prepare for the UEE (University Entrance Exam). Keep answers clear, concise, and exam-relevant. ' +
  'Use simple language a high school student can follow. If asked something far outside academics, gently ' +
  'steer the conversation back to studying.';

const sendBody = z.object({ text: z.string().trim().min(1).max(MAX_INPUT_CHARS) });

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function isProUser(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return !!sub && sub.status === 'active' && sub.expiresAt > new Date();
}

// Real LLM calls only — the capped/fallback replies below don't touch this, since
// the whole point is counting billable calls, not messages sent.
async function dailyUsageCount(userId: string): Promise<number> {
  const raw = await redis.get(`unity:usage:${userId}:${todayKey()}`);
  return raw ? Number(raw) : 0;
}

async function incrementDailyUsage(userId: string): Promise<void> {
  const key = `unity:usage:${userId}:${todayKey()}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 48); // 2-day TTL — generous, self-cleaning
}

export async function chatRoutes(app: FastifyInstance) {
  app.get('/chat/messages', { preHandler: authenticate }, async (request) => {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return messages.map((m) => ({ id: m.id, role: m.role, text: m.text, createdAt: m.createdAt }));
  });

  app.post('/chat/messages', { preHandler: authenticate }, async (request, reply) => {
    const { text } = sendBody.parse(request.body);
    const userId = request.userId;

    await prisma.chatMessage.create({ data: { userId, role: 'user', text } });

    const pro = await isProUser(userId);
    if (!pro && (await dailyUsageCount(userId)) >= DAILY_FREE_LIMIT) {
      const limitText =
        "You've reached today's free chat limit. It resets tomorrow — or upgrade to Compass Pro for unlimited " +
        'access to Unity.';
      const saved = await prisma.chatMessage.create({ data: { userId, role: 'unity', text: limitText } });
      return reply.send({ id: saved.id, role: saved.role, text: saved.text, createdAt: saved.createdAt });
    }

    const history = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_WINDOW,
    });
    const chronological = history.reverse();

    const groqMessages: GroqChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chronological.map((m): GroqChatMessage => ({ role: m.role === 'unity' ? 'assistant' : 'user', content: m.text })),
    ];

    let replyText: string;
    try {
      replyText = await groqChat(groqMessages, MAX_RESPONSE_TOKENS);
    } catch (err) {
      request.log.error(err, '[chat] Groq call failed');
      replyText = "Sorry, I'm having trouble responding right now — please try again in a moment.";
      const saved = await prisma.chatMessage.create({ data: { userId, role: 'unity', text: replyText } });
      return reply.send({ id: saved.id, role: saved.role, text: saved.text, createdAt: saved.createdAt });
    }

    await incrementDailyUsage(userId);
    const saved = await prisma.chatMessage.create({ data: { userId, role: 'unity', text: replyText } });
    return reply.send({ id: saved.id, role: saved.role, text: saved.text, createdAt: saved.createdAt });
  });
}
