import type { NavigatorScreenParams } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Auth: undefined;
  OtpVerification: { phone: string };
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
  UeeHome: undefined;
  YearSubjects: { year: number };
  PaperViewer: { year: number; subjectId: string; subjectName: string };
  SolutionDetail: { year: number; subjectId: string; subjectName: string; questionIndex: number };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Statistics: undefined;
  Achievements: undefined;
  Settings: undefined;
  Premium: undefined;
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
