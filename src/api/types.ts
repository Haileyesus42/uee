export type JourneyStatus = 'locked' | 'available' | 'current' | 'completed';

export type Subject = { id: string; slug: string; name: string; icon: string; mastery: number };

export type UnitLesson = { id: string; title: string; status: JourneyStatus };
export type Unit = { id: string; title: string; description: string; grade: number; lessons: UnitLesson[] };

export type LessonStep =
  | { type: 'explanation'; heading: string; body: string }
  | { type: 'example'; heading: string; body: string; steps: string[] }
  | { type: 'question'; prompt: string; options: string[]; correctIndex: number; hint: string; explanation: string };

export type LessonDetail = { id: string; title: string; steps: LessonStep[] };

export type PracticeQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type QuizReviewItem = {
  questionId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  explanation: string;
};

export type QuizSubmitResult = {
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  xpAwarded: number;
  reviewItems: QuizReviewItem[];
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  avatarEmoji: string;
  xp: number;
  isCurrentUser: boolean;
};

export type LeaderboardResponse = {
  period: 'weekly' | 'monthly' | 'allTime';
  available: boolean;
  entries: LeaderboardEntry[];
};

export type Profile = {
  id: string;
  phone: string;
  name: string;
  avatarEmoji: string;
  grade: number;
  xp: number;
  streakDays: number;
  hearts: number;
  level: number;
  levelTitle: string;
  accuracy: number;
  questionsSolved: number;
  studyTimeSeconds: number;
  lessonsCompleted: number;
  ueeExamsCompleted: number;
};

export type Mistake = {
  subject: string;
  question: { prompt: string; options: string[]; correctIndex: number; explanation: string };
};

export type SubscriptionStatus =
  | { status: 'none' }
  | { status: 'active' | 'expired' | 'canceled'; plan: 'monthly' | 'yearly'; priceETB: number; startedAt: string; expiresAt: string };
