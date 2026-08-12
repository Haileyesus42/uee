import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../api/leaderboard';
import { LeaderboardResponse } from '../api/types';

export function useLeaderboard(period: 'weekly' | 'monthly' | 'allTime') {
  return useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', period],
    queryFn: () => getLeaderboard(period),
  });
}
