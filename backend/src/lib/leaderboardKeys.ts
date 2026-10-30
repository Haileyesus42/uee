export function periodKeys(now: Date = new Date()): { weekKey: string; monthKey: string } {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekKey = `week:${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  const monthKey = `month:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return { weekKey, monthKey };
}

export function nationalKey(period: 'allTime' | 'weekly' | 'monthly'): string {
  if (period === 'allTime') return 'leaderboard:alltime';
  const { weekKey, monthKey } = periodKeys();
  return `leaderboard:${period === 'weekly' ? weekKey : monthKey}`;
}

export function schoolKey(
  schoolId: string,
  period: 'allTime' | 'weekly' | 'monthly',
): string {
  if (period === 'allTime') return `leaderboard:school:${schoolId}:alltime`;
  const { weekKey, monthKey } = periodKeys();
  return `leaderboard:school:${schoolId}:${period === 'weekly' ? weekKey : monthKey}`;
}

export const PERIOD_TTL_SECONDS: Record<'weekly' | 'monthly', number> = {
  weekly: 8 * 24 * 60 * 60,
  monthly: 35 * 24 * 60 * 60,
};