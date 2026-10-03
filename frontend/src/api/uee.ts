import { apiFetch } from './client';
import { PracticeQuestion, UeeStream, UeeStreamId, UeeSubject } from './types';

export function getUeeStreams(): Promise<UeeStream[]> {
  return apiFetch('/uee/streams');
}

export function getUeeYears(): Promise<number[]> {
  return apiFetch('/uee/years');
}

export function getUeeSubjects(stream: UeeStreamId): Promise<UeeSubject[]> {
  return apiFetch(`/uee/${stream}/subjects`);
}

export function getUeeQuestions(stream: UeeStreamId, year: number, subjectId: string): Promise<PracticeQuestion[]> {
  return apiFetch(`/uee/${stream}/${year}/${subjectId}/questions`);
}

export function startUeeExam(stream: UeeStreamId, year: number, subjectId: string): Promise<{ id: string }> {
  return apiFetch(`/uee/${stream}/${year}/${subjectId}/exam`, { method: 'POST' });
}
