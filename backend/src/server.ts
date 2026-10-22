import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
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
import { textbookRoutes } from './modules/textbook/routes';
import { chatRoutes } from './modules/chat/routes';

async function main() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : true,
  });

  await app.register(cors, { origin: true });
  // Only the Telebirr screenshot submission route actually consumes multipart
  // (via request.parts()) — registering it globally is harmless for every other
  // route, which still goes through the default JSON parser untouched.
  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

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
  await app.register(textbookRoutes);
  await app.register(chatRoutes);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME && env.TELEGRAM_POLLING_ENABLED) {
    startTelegramPolling().catch((err) => app.log.error(err, '[telegram] polling loop crashed'));
  } else if (!env.TELEGRAM_POLLING_ENABLED) {
    app.log.warn(
      'TELEGRAM_POLLING_ENABLED=false — Telegram login is disabled (no getUpdates polling); the rest of the API is unaffected.'
    );
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
