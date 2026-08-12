import { prisma } from './prisma';
import { redis } from './redis';

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isYesterday(lastActiveDate: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return dayKey(lastActiveDate) === dayKey(yesterday);
}

// Append-only XP log (doc §8): never a direct `xp += n`, so "why does this user have
// N xp" stays answerable from XP_EVENT, and the same write feeds the leaderboard.
export async function awardXp(userId: string, amount: number, reason: string): Promise<void> {
  const now = new Date();
  const today = dayKey(now);

  await prisma.$transaction(async (tx) => {
    await tx.xpEvent.create({ data: { userId, amount, reason } });

    const stats = await tx.userStats.findUnique({ where: { userId } });
    const lastActive = stats?.lastActiveDate ?? null;
    const alreadyLoggedToday = lastActive !== null && dayKey(lastActive) === today;

    let streakDays = stats?.streakDays ?? 0;
    if (!alreadyLoggedToday) {
      streakDays = lastActive && isYesterday(lastActive, now) ? streakDays + 1 : 1;
    }

    await tx.userStats.upsert({
      where: { userId },
      create: { userId, xp: amount, streakDays, lastActiveDate: now },
      update: { xp: { increment: amount }, streakDays, lastActiveDate: now },
    });
  });

  await redis.zincrby('leaderboard:alltime', amount, `user:${userId}`);
}

const HEARTS_MAX = 5;
const HEARTS_REGEN_INTERVAL_MS = 30 * 60 * 1000; // one heart every 30 minutes

export function computeAvailableHearts(current: number, regenAt: Date | null): number {
  if (current >= HEARTS_MAX || !regenAt) return current;
  const elapsedMs = Date.now() - regenAt.getTime();
  if (elapsedMs <= 0) return current;
  const regenerated = Math.floor(elapsedMs / HEARTS_REGEN_INTERVAL_MS);
  return Math.min(HEARTS_MAX, current + regenerated);
}

export async function loseHeart(userId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const stats = await tx.userStats.findUniqueOrThrow({ where: { userId } });
    const available = computeAvailableHearts(stats.hearts, stats.heartsRegenAt);
    const next = Math.max(0, available - 1);
    const updated = await tx.userStats.update({
      where: { userId },
      data: { hearts: next, heartsRegenAt: next < HEARTS_MAX ? (stats.heartsRegenAt ?? new Date()) : null },
    });
    return updated.hearts;
  });
}
