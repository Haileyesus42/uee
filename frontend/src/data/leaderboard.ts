export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarEmoji: string;
  hasAvatarPhoto: boolean;
  xp: number;
  isCurrentUser?: boolean;
};
