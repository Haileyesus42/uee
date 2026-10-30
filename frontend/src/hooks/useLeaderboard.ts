import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../api/leaderboard';
import { LeaderboardPeriod, LeaderboardResponse, LeaderboardScope } from '../data/leaderboard';

export function useLeaderboard(period: LeaderboardPeriod, scope: LeaderboardScope) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', scope, period],
    queryFn: () => getLeaderboard(period, scope),
  });
}