import { apiFetch } from './client';
import { PracticeQuestion, QuizSubmitResult } from './types';

export function getPracticeQuestions(subjectId: string, count: number): Promise<PracticeQuestion[]> {
  return apiFetch(`/practice/questions?subjectId=${subjectId}&count=${count}`);
}

export function startQuizAttempt(body: {
  mode: 'practice' | 'mock';
  source?: 'practice' | 'uee_exam';
  subjectId: string;
  topic?: string;
  pastPaperYear?: number;
}): Promise<{ id: string }> {
  return apiFetch('/quiz-attempts', { method: 'POST', body });
}

export function answerQuizAttempt(
  attemptId: string,
  body: { questionId: string; selectedIndex: number }
): Promise<{ ok: true; correct: boolean }> {
  return apiFetch(`/quiz-attempts/${attemptId}/answers`, { method: 'PATCH', body });
}

export function submitQuizAttempt(attemptId: string): Promise<QuizSubmitResult> {
  return apiFetch(`/quiz-attempts/${attemptId}/submit`, { method: 'POST' });
}
