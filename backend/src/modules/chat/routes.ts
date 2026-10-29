import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { groqChat, GroqChatMessage } from '../../lib/groq';
import { authenticate } from '../../plugins/authenticate';

const MAX_RESPONSE_TOKENS = 400;
const DAILY_FREE_LIMIT = 5;
const HISTORY_WINDOW = 10;
const MAX_MESSAGES_PER_MINUTE = 10;

const SYSTEM_PROMPT =
  'You are Unity, a friendly and encouraging AI tutor inside Tizata UEE, an app helping Ethiopian grade 9-12 ' +
  'students prepare for the UEE (University Entrance Exam). Keep answers clear, concise, and exam-relevant. ' +
  'Use simple language a high school student can follow. If asked something far outside academics, gently ' +
  'steer the conversation back to studying.';

const sendBody = z.object({
  text: z.string().min(1).max(2000),
  context: z
    .object({
      questionId: z.string().optional(),
      stepId: z.string().optional(),
    })
    .optional(),
});

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function isProUser(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return !!sub && sub.status === 'active' && sub.expiresAt > new Date();
}

async function dailyUsageCount(userId: string): Promise<number> {
  const raw = await redis.get(`unity:usage:${userId}:${todayKey()}`);
  return raw ? Number(raw) : 0;
}

async function incrementDailyUsage(userId: string): Promise<void> {
  const key = `unity:usage:${userId}:${todayKey()}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 48);
}

async function tooManyMessagesThisMinute(userId: string): Promise<boolean> {
  const key = `unity:ratelimit:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count > MAX_MESSAGES_PER_MINUTE;
}

export async function chatRoutes(app: FastifyInstance) {
  // GET — filters by questionId when provided. Used by the panel for
  // per-question threads. Floating Unity button sends no questionId → general.
  app.get('/chat/messages', { preHandler: authenticate }, async (request) => {
    const { questionId } = request.query as { questionId?: string };

    const where: any = { userId: request.userId };
    if (questionId) {
      where.context = { path: ['questionId'], equals: questionId };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      text: m.text,
      createdAt: m.createdAt,
      context: m.context,
    }));
  });

  app.post('/chat/messages', { preHandler: authenticate }, async (request, reply) => {
    const { text, context } = sendBody.parse(request.body);
    const userId = request.userId;

    // Diagnostic — remove once pre-gen is confirmed working.
    console.log(
      '[BACKEND] POST — text len:',
      text.length,
      '| context:',
      JSON.stringify(context),
      '| flag:',
      process.env.UNITY_PREGEN_ENABLED,
    );

    if (await tooManyMessagesThisMinute(userId)) {
      return reply.code(429).send({ error: "You're sending messages too fast — try again in a moment." });
    }

    await prisma.chatMessage.create({
      data: { userId, role: 'user', text, context: (context ?? {}) as any },
    });

    // ── PRE-GEN PATH ──────────────────────────────────────────────────────
    if (context?.questionId && process.env.UNITY_PREGEN_ENABLED === 'true') {
      const q = await prisma.question.findUnique({
        where: { id: context.questionId },
        select: { aiDeepExplanation: true, aiFollowUps: true },
      });

      console.log(
        '[BACKEND] pre-gen lookup — found:',
        !!q,
        '| explanation len:',
        q?.aiDeepExplanation?.length ?? 0,
      );

      if (q?.aiDeepExplanation && q.aiDeepExplanation.trim().length > 0) {
        const saved = await prisma.chatMessage.create({
          data: {
            userId,
            role: 'unity',
            text: q.aiDeepExplanation,
            context: {
              questionId: context.questionId,
              followUps: q.aiFollowUps,
            } as any,
          },
        });
        return reply.send({
          id: saved.id,
          role: saved.role,
          text: saved.text,
          createdAt: saved.createdAt,
          context: saved.context,
        });
      }
    }
    // ── END PRE-GEN PATH ──────────────────────────────────────────────────

    const pro = await isProUser(userId);
    if (!pro && (await dailyUsageCount(userId)) >= DAILY_FREE_LIMIT) {
      const limitText =
        "You've reached today's free chat limit. It resets tomorrow — or upgrade to Tizata Pro for unlimited " +
        'access to Unity.';
      const saved = await prisma.chatMessage.create({ data: { userId, role: 'unity', text: limitText } });
      return reply.send({
        id: saved.id,
        role: saved.role,
        text: saved.text,
        createdAt: saved.createdAt,
        context: saved.context,
      });
    }

    const history = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_WINDOW,
    });
    const chronological = history.reverse();

    const groqMessages: GroqChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chronological.map((m): GroqChatMessage => ({
        role: m.role === 'unity' ? 'assistant' : 'user',
        content: m.text,
      })),
    ];

    let replyText: string;
    try {
      replyText = await groqChat(groqMessages, MAX_RESPONSE_TOKENS);
    } catch (err) {
      request.log.error(err, '[chat] Groq call failed');
      replyText = "Sorry, I'm having trouble responding right now — please try again in a moment.";
      const saved = await prisma.chatMessage.create({ data: { userId, role: 'unity', text: replyText } });
      return reply.send({
        id: saved.id,
        role: saved.role,
        text: saved.text,
        createdAt: saved.createdAt,
        context: saved.context,
      });
    }

    await incrementDailyUsage(userId);
    const saved = await prisma.chatMessage.create({ data: { userId, role: 'unity', text: replyText } });
    return reply.send({
      id: saved.id,
      role: saved.role,
      text: saved.text,
      createdAt: saved.createdAt,
      context: saved.context,
    });
  });
}