import { apiFetch } from './client';
import { LessonDetail, Subject, Unit } from './types';

export function getSubjects(): Promise<Subject[]> {
  return apiFetch('/subjects');
}

export function getUnits(subjectId: string, grade?: number): Promise<Unit[]> {
  const query = grade ? `?grade=${grade}` : '';
  return apiFetch(`/subjects/${subjectId}/units${query}`);
}

export function getLesson(lessonId: string): Promise<LessonDetail> {
  return apiFetch(`/lessons/${lessonId}`);
}

export function postLessonProgress(
  lessonId: string,
  body: { correctCount: number; totalSteps: number }
): Promise<{ ok: true; xpAwarded: number }> {
  return apiFetch(`/lessons/${lessonId}/progress`, { method: 'POST', body });
}
