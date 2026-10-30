import { prisma } from './prisma';
import { redis } from './redis';
import { periodKeys, PERIOD_TTL_SECONDS } from './leaderboardKeys';

export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  idempotencyKey?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { schoolId: true },
  });
  const schoolId = user?.schoolId ?? null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.xpEvent.create({
        data: { userId, amount, reason, schoolId, idempotencyKey },
      });
      await tx.userStats.upsert({
        where: { userId },
        create: { userId, xp: amount },
        update: { xp: { increment: amount } },
      });
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') return;
    throw err;
  }

  try {
    const { weekKey, monthKey } = periodKeys();

    await Promise.all([
      redis.zincrby('leaderboard:alltime', amount, `user:${userId}`),
      redis.zincrby(`leaderboard:${weekKey}`, amount, `user:${userId}`),
      redis.zincrby(`leaderboard:${monthKey}`, amount, `user:${userId}`),
    ]);
    await Promise.all([
      redis.expire(`leaderboard:${weekKey}`, PERIOD_TTL_SECONDS.weekly),
      redis.expire(`leaderboard:${monthKey}`, PERIOD_TTL_SECONDS.monthly),
    ]);

    if (schoolId) {
      await Promise.all([
        redis.zincrby(`leaderboard:school:${schoolId}:alltime`, amount, `user:${userId}`),
        redis.zincrby(`leaderboard:school:${schoolId}:${weekKey}`, amount, `user:${userId}`),
        redis.zincrby(`leaderboard:school:${schoolId}:${monthKey}`, amount, `user:${userId}`),
      ]);
      await Promise.all([
        redis.expire(`leaderboard:school:${schoolId}:${weekKey}`, PERIOD_TTL_SECONDS.weekly),
        redis.expire(`leaderboard:school:${schoolId}:${monthKey}`, PERIOD_TTL_SECONDS.monthly),
      ]);
    }
  } catch (err) {
    console.error('[leaderboard] Redis update failed after XP award', { userId, amount, schoolId, err });
  }
}
// Hearts regen model:
//   - 5 hearts maximum.
//   - A heart regenerates every 30 minutes.
//   - When hearts are full, heartsRegenAt is null and no timer runs.
//   - Callers pass the stored hearts count and the timestamp from which
//     regeneration should be counted; this returns how many hearts are
//     actually available right now, computed lazily on read.
//
// This function was accidentally removed when gamification.ts was rewritten
// for the school leaderboard feature. buildProfilePayload in profile/routes.ts
// still imports it, so the whole /me endpoint was 500-ing.
const MAX_HEARTS = 5;
const HEART_REGEN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function computeAvailableHearts(
  storedHearts: number,
  heartsRegenAt: Date | null,
): number {
  if (storedHearts >= MAX_HEARTS) return MAX_HEARTS;
  if (!heartsRegenAt) return storedHearts;

  const elapsedMs = Date.now() - heartsRegenAt.getTime();
  if (elapsedMs < 0) return storedHearts;

  const regened = Math.floor(elapsedMs / HEART_REGEN_INTERVAL_MS);
  return Math.min(MAX_HEARTS, storedHearts + regened);
}
