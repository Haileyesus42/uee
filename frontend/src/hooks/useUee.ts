import { useQuery } from '@tanstack/react-query';
import { getUeeQuestions, getUeeYears } from '../api/uee';
import { PracticeQuestion } from '../api/types';

export function useUeeYears() {
  return useQuery<number[]>({ queryKey: ['uee-years'], queryFn: getUeeYears });
}

export function useUeeQuestions(year: number, subjectId: string) {
  return useQuery<PracticeQuestion[]>({
    queryKey: ['uee-questions', year, subjectId],
    queryFn: () => getUeeQuestions(year, subjectId),
    enabled: !!subjectId,
  });
}
