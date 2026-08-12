import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { env } from './env';
import { authRoutes } from './modules/auth/routes';
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
