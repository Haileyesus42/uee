import { apiFetch } from './client';
import { LeaderboardResponse } from './types';

export function getLeaderboard(period: 'weekly' | 'monthly' | 'allTime'): Promise<LeaderboardResponse> {
  return apiFetch(`/leaderboard?period=${period}`);
}
