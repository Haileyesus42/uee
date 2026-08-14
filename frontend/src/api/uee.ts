import { apiFetch } from './client';
import { PracticeQuestion } from './types';

export function getUeeYears(): Promise<number[]> {
  return apiFetch('/uee/years');
}

export function getUeeQuestions(year: number, subjectId: string): Promise<PracticeQuestion[]> {
  return apiFetch(`/uee/${year}/${subjectId}/questions`);
}

export function startUeeExam(year: number, subjectId: string): Promise<{ id: string }> {
  return apiFetch(`/uee/${year}/${subjectId}/exam`, { method: 'POST' });
}
