import type { NavigatorScreenParams } from '@react-navigation/native';
import type { UeeStreamId } from '../api/types';

export type OnboardingStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Auth: undefined;
  GradeSelection: undefined;
  SubjectSelection: undefined;
  UeeGoal: undefined;
  TargetScore: undefined;
  DailyStudyGoal: undefined;
  DiagnosticIntroduction: undefined;
  DiagnosticQuestion: undefined;
  DiagnosticResults: undefined;
  PersonalizedPath: undefined;
};

export type LearnStackParamList = {
  LearnHome: undefined;
  SubjectPath: { subjectId: string };
  TopicDetail: { subjectId: string; unitId: string };
  LessonIntroduction: { subjectId: string; unitId: string; lessonId: string };
  Lesson: { subjectId: string; unitId: string; lessonId: string };
  LessonComplete: {
    subjectId: string;
    unitId: string;
    lessonId: string;
    xpEarned: number;
    correctCount: number;
    totalQuestions: number;
  };
  // Textbook Study Mode — flat siblings alongside the Interactive-mode routes
  // above, same stack (see docs/backend-architecture.md for why: matches how
  // TopicDetail/LessonIntroduction/etc. already coexist, no nested navigator).
  TextbookHome: { subjectId: string };
  TextbookReader: { subjectId: string; sectionId: string };
  TextbookSearch: { subjectId: string };
  TextbookBookmarks: { subjectId: string };
};

export type QuizMode = 'practice' | 'mock';

export type PracticeStackParamList = {
  PracticeHub: undefined;
  QuizSetup: { mode: QuizMode; presetSubjectId?: string };
  MockExamsList: undefined;
  QuizRunner: {
    mode: QuizMode;
    subjectId: string;
    subjectName: string;
    topic: string;
    questionCount: number;
    timeLimitMinutes?: number;
    pastPaperYear?: number;
    pastPaperStream?: UeeStreamId;
  };
  Results: {
    mode: QuizMode;
    subjectName: string;
    topic: string;
    correctCount: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    reviewItems: {
      prompt: string;
      options: string[];
      correctIndex: number;
      selectedIndex: number;
      explanation: string;
    }[];
  };
};

export type UeeStackParamList = {
  StreamSelect: undefined;
  UeeHome: { stream: UeeStreamId };
  YearSubjects: { stream: UeeStreamId; year: number };
  PaperViewer: { stream: UeeStreamId; year: number; subjectId: string; subjectName: string };
  SolutionDetail: {
    stream: UeeStreamId;
    year: number;
    subjectId: string;
    subjectName: string;
    questionIndex: number;
  };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Statistics: undefined;
  Achievements: undefined;
  Settings: undefined;
  Premium: undefined;
  TelebirrPayment: { plan: 'monthly' | 'yearly' };
  Help: undefined;
  MistakesBook: undefined;
};

export type LeaderboardStackParamList = {
  LeaderboardHome: undefined;
};

export type HomeStackParamList = {
  HomeDashboard: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Learn: NavigatorScreenParams<LearnStackParamList>;
  Practice: NavigatorScreenParams<PracticeStackParamList>;
  Uee: NavigatorScreenParams<UeeStackParamList>;
  Leaderboard: NavigatorScreenParams<LeaderboardStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};
