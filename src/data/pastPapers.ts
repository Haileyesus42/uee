import { getPracticeQuestions, PracticeQuestion } from './practiceQuestions';

const CURRENT_YEAR = new Date().getFullYear();

// 20+ years, most recent first.
export const PAST_PAPER_YEARS: number[] = Array.from({ length: 22 }, (_, i) => CURRENT_YEAR - i);

const QUESTIONS_PER_PAPER = 10;

// Papers reuse the practice question bank (per subject) rather than distinct
// per-year archives — there's no real historical question dataset yet.
export function getPaperQuestions(subjectId: string, _year: number): PracticeQuestion[] {
  return getPracticeQuestions(subjectId, QUESTIONS_PER_PAPER);
}
