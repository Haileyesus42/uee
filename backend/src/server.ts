import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { env } from './env';
import { authRoutes } from './modules/auth/routes';
import { startTelegramPolling } from './modules/auth/telegramBot';
import { curriculumRoutes } from './modules/curriculum/routes';
import { practiceRoutes } from './modules/practice/routes';
import { ueeRoutes } from './modules/uee/routes';
import { leaderboardRoutes } from './modules/leaderboard/routes';
import { profileRoutes } from './modules/profile/routes';
import { billingRoutes } from './modules/billing/routes';

async function main() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : true,
  });

  await app.register(cors, { origin: true });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Validation error', issues: error.issues });
    }
    // Fastify's own errors (malformed JSON, empty body with a JSON content-type,
    // payload too large, etc.) already carry the right client-error status — reporting
    // all of them as a bare 500 hid a real 400 behind a misleading "Internal server
    // error" (see POST /auth/telegram/start with no body).
    const { statusCode, message } = error as { statusCode?: number; message: string };
    if (typeof statusCode === 'number' && statusCode < 500) {
      return reply.code(statusCode).send({ error: message });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });

  app.get('/health', async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(curriculumRoutes);
  await app.register(practiceRoutes);
  await app.register(ueeRoutes);
  await app.register(leaderboardRoutes);
  await app.register(profileRoutes);
  await app.register(billingRoutes);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME) {
    startTelegramPolling().catch((err) => app.log.error(err, '[telegram] polling loop crashed'));
  } else {
    app.log.warn(
      'TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_USERNAME not set — Telegram login is disabled until both are configured.'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
