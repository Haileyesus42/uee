export type JourneyStatus = 'locked' | 'available' | 'current' | 'completed';

export type Subject = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  mastery: number;
  hasTextbook: boolean;
  hasTeacherGuide: boolean;
};
export type TextbookKind = 'textbook' | 'teacher_guide';

export type UeeStreamId = 'natural' | 'social';
export type UeeStream = { id: UeeStreamId; label: string };
export type UeeSubject = { id: string; slug: string; name: string; icon: string };

export type ChatMessage = { id: string; role: 'user' | 'unity'; text: string; createdAt: string };

export type UnitLesson = { id: string; title: string; status: JourneyStatus };
export type Unit = { id: string; title: string; description: string; grade: number; lessons: UnitLesson[] };

export type LessonStep =
  | { type: 'explanation'; heading: string; body: string }
  | { type: 'example'; heading: string; body: string; steps: string[] }
  | { type: 'question'; prompt: string; options: string[]; correctIndex: number; hint: string; explanation: string };

export type LessonDetail = { id: string; title: string; steps: LessonStep[]; textbookSectionId: string | null };

export type PracticeQuestion = {
  id: string;
  prompt: string;
  options: string[];
  // null = the source published this question without an answer key; it is
  // readable but never scored.
  correctIndex: number | null;
  explanation: string;
};

export type QuizReviewItem = {
  questionId: string;
  prompt: string;
  options: string[];
  correctIndex: number | null;
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
  userId: string;
  name: string;
  avatarEmoji: string;
  hasAvatarPhoto: boolean;
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
  telegramId: string;
  telegramUsername: string | null;
  name: string;
  avatarEmoji: string;
  hasAvatarPhoto: boolean;
  bio: string | null;
  birthday: { day: number; month: number; year: number | null } | null;
  languageCode: string | null;
  isPremium: boolean;
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
  question: { prompt: string; options: string[]; correctIndex: number | null; explanation: string };
};

// Textbook Study Mode
export type TextbookTocSection = {
  id: string;
  unitTitle: string;
  sectionTitle: string;
  order: number;
  pageStart: number;
  pageEnd: number;
};
export type TextbookTocUnit = { unitTitle: string; sections: TextbookTocSection[] };

export type TextbookContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; filename: string; width: number; height: number; caption?: string }
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; rows: string[][]; caption?: string };

export type TextbookSectionDetail = {
  id: string;
  unitTitle: string;
  sectionTitle: string;
  blocks: TextbookContentBlock[];
  // True when the section is a facsimile (page-image) edition: no extracted
  // text, so text search and highlighting don't apply.
  isFacsimile?: boolean;
  // Page range this section covers; used to resolve a "go to page N" request.
  pageStart: number;
  pageEnd: number;
  lessonId: string | null;
  unitId: string | null;
  prevSectionId: string | null;
  nextSectionId: string | null;
};

export type TextbookSearchResult = { sectionId: string; sectionTitle: string; snippet: string };

export type TextbookEdition = { facsimile: boolean };

export type TextbookBookmark = {
  id: string;
  sectionId: string;
  createdAt: string;
  section: { sectionTitle: string; unitTitle: string; subjectId: string; kind: TextbookKind };
};

export type TextbookHighlight = { id: string; sectionId: string; paragraphIndex: number; note: string | null; createdAt: string };

export type TextbookReadingProgress = { subjectId: string; sectionId: string; paragraphIndex: number; updatedAt: string } | null;

export type SubscriptionStatus =
  | { status: 'none' }
  | {
      status: 'pending' | 'active' | 'expired' | 'canceled';
      plan: 'monthly' | 'yearly';
      priceETB: number;
      startedAt: string;
      expiresAt: string;
    };

export type TelebirrInfo =
  | { enabled: false }
  | { enabled: true; receiverPhone: string; receiverName: string | null; priceETB: Record<'monthly' | 'yearly', number> };

export type TelebirrSubmissionStatus = 'approved' | 'rejected' | 'needs_review';

export type TelebirrSubmission = {
  id: string;
  status: TelebirrSubmissionStatus;
  plan: 'monthly' | 'yearly';
  priceETB: number;
  reviewNote: string | null;
  createdAt: string;
};

// AppNotification, not Notification — the latter collides with the DOM/RN global.
export type AppNotification = { id: string; title: string; body: string; read: boolean; createdAt: string };
