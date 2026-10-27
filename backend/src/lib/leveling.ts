// Level/title are derived from XP on read, not stored — same "compute, don't
// duplicate state" approach already used for hearts in lib/gamification.ts.
const TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: 'New Learner' },
  { minLevel: 4, title: 'Steady Climber' },
  { minLevel: 8, title: 'Rising Scholar' },
  { minLevel: 15, title: 'Exam Strategist' },
  { minLevel: 25, title: 'Tizata Master' },
];

const XP_PER_LEVEL = 250;

export function xpToLevel(xp: number): { level: number; levelTitle: string } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const title = [...TITLES].reverse().find((t) => level >= t.minLevel)?.title ?? TITLES[0].title;
  return { level, levelTitle: title };
}
