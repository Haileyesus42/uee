import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { authenticate } from '../../plugins/authenticate';

const query = z.object({ period: z.enum(['weekly', 'monthly', 'allTime']).default('allTime') });
const TOP_N = 20;

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/leaderboard', { preHandler: authenticate }, async (request) => {
    const { period } = query.parse(request.query);

    // Phase 1 ships all-time only (docs/backend-architecture.md §13) — weekly/monthly
    // period keys aren't written yet, so those periods report unavailable rather than
    // silently returning an empty-but-plausible list.
    if (period !== 'allTime') {
      return { period, available: false, entries: [] };
    }

    const raw = await redis.zrevrange('leaderboard:alltime', 0, TOP_N - 1, 'WITHSCORES');
    const ranked: { userId: string; xp: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      ranked.push({ userId: raw[i].replace(/^user:/, ''), xp: Math.round(Number(raw[i + 1])) });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: ranked.map((r) => r.userId) } },
      select: { id: true, name: true, avatarEmoji: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const entries = ranked.map((r, i) => {
      const user = userById.get(r.userId);
      return {
        rank: i + 1,
        name: user?.name || 'Student',
        avatarEmoji: user?.avatarEmoji ?? '🧑🎓',
        xp: r.xp,
        isCurrentUser: r.userId === request.userId,
      };
    });

    return { period, available: true, entries };
  });
}
