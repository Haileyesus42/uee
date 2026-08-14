export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  avatarEmoji: string;
  xp: number;
  isCurrentUser?: boolean;
};

export const LEADERBOARD_DATA: Record<LeaderboardPeriod, LeaderboardEntry[]> = {
  weekly: [
    { rank: 1, name: 'Bethlehem A.', avatarEmoji: '🧕🏾', xp: 3120 },
    { rank: 2, name: 'Yonas K.', avatarEmoji: '🧑🏾', xp: 2890 },
    { rank: 3, name: 'Ruth M.', avatarEmoji: '👩🏽', xp: 2640 },
    { rank: 4, name: 'Dawit T.', avatarEmoji: '🧑🏿', xp: 2210 },
    { rank: 5, name: 'Selam Tesfaye', avatarEmoji: '👩🏾‍🎓', xp: 1250, isCurrentUser: true },
    { rank: 6, name: 'Hana G.', avatarEmoji: '👧🏾', xp: 1180 },
    { rank: 7, name: 'Abel S.', avatarEmoji: '🧑🏽', xp: 1050 },
    { rank: 8, name: 'Meron D.', avatarEmoji: '👩🏿', xp: 980 },
  ],
  monthly: [
    { rank: 1, name: 'Ruth M.', avatarEmoji: '👩🏽', xp: 9840 },
    { rank: 2, name: 'Bethlehem A.', avatarEmoji: '🧕🏾', xp: 9320 },
    { rank: 3, name: 'Yonas K.', avatarEmoji: '🧑🏾', xp: 8760 },
    { rank: 4, name: 'Selam Tesfaye', avatarEmoji: '👩🏾‍🎓', xp: 6420, isCurrentUser: true },
    { rank: 5, name: 'Dawit T.', avatarEmoji: '🧑🏿', xp: 6150 },
    { rank: 6, name: 'Abel S.', avatarEmoji: '🧑🏽', xp: 5480 },
    { rank: 7, name: 'Hana G.', avatarEmoji: '👧🏾', xp: 5120 },
    { rank: 8, name: 'Meron D.', avatarEmoji: '👩🏿', xp: 4780 },
  ],
  allTime: [
    { rank: 1, name: 'Yonas K.', avatarEmoji: '🧑🏾', xp: 42500 },
    { rank: 2, name: 'Ruth M.', avatarEmoji: '👩🏽', xp: 39800 },
    { rank: 3, name: 'Bethlehem A.', avatarEmoji: '🧕🏾', xp: 37650 },
    { rank: 4, name: 'Dawit T.', avatarEmoji: '🧑🏿', xp: 28900 },
    { rank: 5, name: 'Abel S.', avatarEmoji: '🧑🏽', xp: 24100 },
    { rank: 6, name: 'Selam Tesfaye', avatarEmoji: '👩🏾‍🎓', xp: 21250, isCurrentUser: true },
    { rank: 7, name: 'Hana G.', avatarEmoji: '👧🏾', xp: 19800 },
    { rank: 8, name: 'Meron D.', avatarEmoji: '👩🏿', xp: 17200 },
  ],
};
