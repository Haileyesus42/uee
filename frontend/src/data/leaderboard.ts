export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';
export type LeaderboardScope = 'national' | 'school';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarEmoji: string;
  hasAvatarPhoto: boolean;
  xp: number;
  isCurrentUser?: boolean;
  grade: number | null;
};

export type LeaderboardResponse = {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  available: boolean;
  reason?: 'no_school';
  entries: LeaderboardEntry[];
  currentUser: { rank: number; xp: number } | null;
  totalParticipants: number;
  school: { id: string; name: string; region: string } | null;
};