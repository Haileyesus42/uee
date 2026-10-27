import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../env';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { storeRefreshToken, isCurrentRefreshToken } from './sessions';
import { createLoginToken, takeLoginResult } from './telegramSessions';
import { fetchTelegramFile, processUpdate, TelegramUpdate } from './telegramBot';

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

const MAX_STARTS_PER_HOUR = 20;

async function issueSession(userId: string, tokenVersion: number) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId, tokenVersion);
  await storeRefreshToken(userId, refreshToken);
  return { accessToken, refreshToken };
}

export async function authRoutes(app: FastifyInstance) {
  // Starts a login attempt: mints a one-time token and hands back the deep link
  // that opens a chat with the bot pre-filled with "/start <token>". The app is
  // expected to open this link, then poll /auth/telegram/status/:token.
  app.post('/auth/telegram/start', async (request, reply) => {
    const ip = request.ip;
    const rateLimitKey = `telegram:start:${ip}`;
    const count = await redis.incr(rateLimitKey);
    if (count === 1) await redis.expire(rateLimitKey, 60 * 60);
    if (count > MAX_STARTS_PER_HOUR) {
      return reply.code(429).send({ error: 'Too many login attempts — try again later.' });
    }

    const loginToken = await createLoginToken();
    return reply.send({
      loginToken,
      deepLink: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${loginToken}`,
    });
  });

  // The app polls this every couple of seconds while the deep link / bot chat is
  // open. Once the bot has processed the matching /start message, the result is
  // waiting here — this endpoint is intentionally unauthenticated (the loginToken
  // itself, an unguessable 32-byte value, is the only credential it needs).
  app.get<{ Params: { token: string } }>('/auth/telegram/status/:token', async (request, reply) => {
    const result = await takeLoginResult(request.params.token);
    if (!result) return reply.send({ status: 'pending' });
    return reply.send({ status: 'verified', ...result });
  });

  // Public by design (no auth) — the URL only leaks an opaque user UUID, and an
  // avatar image isn't sensitive. Lets any screen use a plain <Image> without
  // threading a token through it.
  //
  // A user-uploaded photo takes priority over their Telegram one — it's a
  // deliberate choice, the Telegram photo is just whatever happened to be set
  // (and frequently isn't visible to the bot at all, see avatarFileId's comment).
  app.get<{ Params: { userId: string } }>('/avatars/:userId', async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.params.userId },
      select: { avatarFileId: true, avatarUpload: true, avatarUploadType: true },
    });
    if (!user) return reply.code(404).send();

    if (user.avatarUpload) {
      reply.header('Cache-Control', 'public, max-age=3600');
      return reply.type(user.avatarUploadType ?? 'image/jpeg').send(user.avatarUpload);
    }

    if (!user.avatarFileId) return reply.code(404).send();
    const file = await fetchTelegramFile(user.avatarFileId);
    if (!file) return reply.code(404).send();

    reply.header('Cache-Control', 'public, max-age=3600');
    return reply.type(file.contentType).send(file.buffer);
  });

  // The production alternative to startTelegramPolling() (see telegramBot.ts)
  // — the only code difference between the two modes is how an update arrives;
  // both call the same processUpdate. Not wired up automatically: switching to
  // this requires (1) setting TELEGRAM_WEBHOOK_SECRET, (2) setting
  // TELEGRAM_POLLING_ENABLED=false so the two modes can't both run and double-
  // process updates, (3) calling Telegram's setWebhook once with this route's
  // public URL and the same secret as `secret_token` — an operational step for
  // whenever real hosting exists, not something to do from a dev box.
  //
  // Authenticated by Telegram's own secret-token header, not this app's normal
  // auth — there's no user session at the point Telegram calls this.
  app.post('/auth/telegram/webhook', async (request, reply) => {
    if (!env.TELEGRAM_WEBHOOK_SECRET) return reply.code(404).send();

    const secret = request.headers['x-telegram-bot-api-secret-token'];
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return reply.code(401).send();
    }

    // Acks immediately, processes after responding — Telegram retries a webhook
    // call that's slow to respond, and update handling here can involve a
    // couple of sequential Telegram/DB calls (see handleStartMessage).
    processUpdate(request.body as TelegramUpdate);
    return reply.code(200).send({ ok: true });
  });

  app.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = refreshBody.parse(request.body);

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return reply.code(401).send({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return reply.code(401).send({ error: 'Session no longer valid' });
    }

    const stillCurrent = await isCurrentRefreshToken(user.id, refreshToken);
    if (!stillCurrent) {
      return reply.code(401).send({ error: 'Refresh token already used' });
    }

    const tokens = await issueSession(user.id, user.tokenVersion);
    return reply.send(tokens);
  });
}
