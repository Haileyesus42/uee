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