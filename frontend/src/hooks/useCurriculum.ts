import { useQueries, useQuery } from '@tanstack/react-query';
import { getLesson, getSubjects, getUnits } from '../api/curriculum';
import { LessonDetail, Subject, Unit } from '../api/types';

export function useSubjects() {
  return useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: getSubjects });
}

export function useUnits(subjectId: string, grade?: number) {
  return useQuery<Unit[]>({
    queryKey: ['units', subjectId, grade ?? 'all'],
    queryFn: () => getUnits(subjectId, grade),
    enabled: !!subjectId,
  });
}

export function useLesson(lessonId: string) {
  return useQuery<LessonDetail>({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId),
    enabled: !!lessonId,
  });
}

// Fetches every subject's full unit tree in parallel — used by LearnHomeScreen to
// derive per-grade lesson counts without a dedicated aggregate endpoint.
export function useAllSubjectUnits(subjects: Subject[] | undefined) {
  return useQueries({
    queries: (subjects ?? []).map((s) => ({
      queryKey: ['units', s.id, 'all'],
      queryFn: () => getUnits(s.id),
      enabled: !!subjects,
    })),
  });
}

export function countLessons(units: Unit[] | undefined): { completed: number; total: number } {
  const lessons = (units ?? []).flatMap((u) => u.lessons);
  return { completed: lessons.filter((l) => l.status === 'completed').length, total: lessons.length };
}

export function countLessonsForGrade(units: Unit[] | undefined, grade: number): { completed: number; total: number } {
  const lessons = (units ?? []).filter((u) => u.grade === grade).flatMap((u) => u.lessons);
  return { completed: lessons.filter((l) => l.status === 'completed').length, total: lessons.length };
}
