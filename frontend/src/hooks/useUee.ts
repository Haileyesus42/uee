import { useQuery } from '@tanstack/react-query';
import { getUeeQuestions, getUeeStreams, getUeeSubjects, getUeeYears } from '../api/uee';
import { PracticeQuestion, UeeStream, UeeStreamId, UeeSubject } from '../api/types';

export function useUeeStreams() {
  return useQuery<UeeStream[]>({ queryKey: ['uee-streams'], queryFn: getUeeStreams });
}

export function useUeeYears() {
  return useQuery<number[]>({ queryKey: ['uee-years'], queryFn: getUeeYears });
}

export function useUeeSubjects(stream: UeeStreamId) {
  return useQuery<UeeSubject[]>({
    queryKey: ['uee-subjects', stream],
    queryFn: () => getUeeSubjects(stream),
    enabled: !!stream,
  });
}

export function useUeeQuestions(stream: UeeStreamId, year: number, subjectId: string) {
  return useQuery<PracticeQuestion[]>({
    queryKey: ['uee-questions', stream, year, subjectId],
    queryFn: () => getUeeQuestions(stream, year, subjectId),
    enabled: !!stream && !!subjectId,
  });
}
