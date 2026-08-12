import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { issueOtp, verifyOtp, RateLimitedError } from './otp';
import { smsProvider } from './smsProvider';
import { storeRefreshToken, isCurrentRefreshToken } from './sessions';

const requestOtpBody = z.object({
  phone: z.string().min(6).max(20),
});

const verifyOtpBody = z.object({
  phone: z.string().min(6).max(20),
  code: z.string().length(4),
});

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

async function issueSession(userId: string, tokenVersion: number) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId, tokenVersion);
  await storeRefreshToken(userId, refreshToken);
  return { accessToken, refreshToken };
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/otp/request', async (request, reply) => {
    const { phone } = requestOtpBody.parse(request.body);

    try {
      const code = await issueOtp(phone);
      await smsProvider.sendOtp(phone, code);
    } catch (err) {
      if (err instanceof RateLimitedError) {
        return reply.code(429).send({ error: err.message });
      }
      throw err;
    }

    return reply.code(202).send({ ok: true });
  });

  app.post('/auth/otp/verify', async (request, reply) => {
    const { phone, code } = verifyOtpBody.parse(request.body);

    let valid: boolean;
    try {
      valid = await verifyOtp(phone, code);
    } catch (err) {
      if (err instanceof RateLimitedError) {
        return reply.code(429).send({ error: err.message });
      }
      throw err;
    }

    if (!valid) {
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    // Login and registration are the same flow — no separate "register" step.
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, stats: { create: {} } },
      });
    }

    const tokens = await issueSession(user.id, user.tokenVersion);
    return reply.send({ ...tokens, user });
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
