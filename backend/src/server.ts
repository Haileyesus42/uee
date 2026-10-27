import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env } from './env';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { authRoutes } from './modules/auth/routes';
import { startTelegramPolling, stopTelegramPolling } from './modules/auth/telegramBot';
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

  // Backed by the same Redis instance as everything else (lib/redis.ts), not
  // the plugin's in-memory default — an in-memory counter resets per process,
  // so it silently stops meaning anything the moment this runs as more than
  // one instance behind a load balancer. This is the one general backstop
  // against API-wide abuse; /auth/telegram/start has its own tighter,
  // endpoint-specific limit on top (see modules/auth/routes.ts) for a reason
  // particular to that route (anti-enumeration), not a replacement for this.
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    redis,
    global: true,
  });

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

  // Every container/process orchestrator (and any real autoscaled or rolling
  // deploy) sends SIGTERM before killing an instance, expecting it to stop
  // accepting new work and finish what's in flight — nothing handled that at
  // all before this. Without it, every instance replacement is a hard kill:
  // in-flight requests dropped mid-response, DB/Redis connections never
  // released (left for Postgres/Redis to notice and reap on their own), and
  // the Telegram poll loop (single-instance only — see telegramBot.ts) left
  // running in a process that's already gone.
  let shuttingDown = false;
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info(`[shutdown] ${signal} received, draining`);
    stopTelegramPolling();
    try {
      await app.close(); // stops accepting new connections, waits for in-flight ones
      await prisma.$disconnect();
      redis.disconnect();
      app.log.info('[shutdown] clean exit');
      process.exit(0);
    } catch (err) {
      app.log.error(err, '[shutdown] error while draining');
      process.exit(1);
    }
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
