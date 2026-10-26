import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBookmark,
  createHighlight,
  deleteBookmark,
  deleteHighlight,
  getBookmarks,
  getHighlights,
  getReadingProgress,
  getTextbookEdition,
  getTextbookSection,
  getTextbookToc,
  putReadingProgress,
  searchTextbook,
} from '../api/textbook';
import {
  Subject,
  TextbookBookmark,
  TextbookEdition,
  TextbookHighlight,
  TextbookKind,
  TextbookReadingProgress,
  TextbookSearchResult,
  TextbookSectionDetail,
  TextbookTocUnit,
} from '../api/types';

export function useTextbookToc(subjectId: string, kind: TextbookKind, grade?: number) {
  return useQuery<TextbookTocUnit[]>({
    queryKey: ['textbookToc', subjectId, kind, grade ?? 'all'],
    queryFn: () => getTextbookToc(subjectId, kind, grade),
    enabled: !!subjectId,
  });
}

export function useTextbookEdition(subjectId: string, kind: TextbookKind) {
  return useQuery<TextbookEdition>({
    queryKey: ['textbookEdition', subjectId, kind],
    queryFn: () => getTextbookEdition(subjectId, kind),
    enabled: !!subjectId,
  });
}

export function useTextbookSection(sectionId: string) {
  return useQuery<TextbookSectionDetail>({
    queryKey: ['textbookSection', sectionId],
    queryFn: () => getTextbookSection(sectionId),
    enabled: !!sectionId,
  });
}

// No useMutation anywhere in this codebase (see LessonScreen's postLessonProgress
// pattern) — mutations are called directly from handlers, followed by manual
// queryClient invalidation of whatever's cached.
export function useTextbookSearch() {
  return {
    search: (subjectId: string, kind: TextbookKind, q: string): Promise<TextbookSearchResult[]> =>
      searchTextbook(subjectId, kind, q),
  };
}

export function useBookmarks(subjectId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery<TextbookBookmark[]>({
    queryKey: ['textbookBookmarks', subjectId ?? 'all'],
    queryFn: () => getBookmarks(subjectId),
  });

  async function toggleBookmark(sectionId: string, existingId?: string) {
    if (existingId) await deleteBookmark(existingId);
    else await createBookmark(sectionId);
    queryClient.invalidateQueries({ queryKey: ['textbookBookmarks'] });
  }

  return { ...query, toggleBookmark };
}

export function useHighlights(sectionId: string) {
  const queryClient = useQueryClient();
  const query = useQuery<TextbookHighlight[]>({
    queryKey: ['textbookHighlights', sectionId],
    queryFn: () => getHighlights(sectionId),
    enabled: !!sectionId,
  });

  async function toggleHighlight(paragraphIndex: number, existingId?: string) {
    if (existingId) await deleteHighlight(existingId);
    else await createHighlight(sectionId, paragraphIndex);
    queryClient.invalidateQueries({ queryKey: ['textbookHighlights', sectionId] });
  }

  return { ...query, toggleHighlight };
}

export function useReadingProgress(subjectId: string, kind: TextbookKind) {
  const queryClient = useQueryClient();
  const query = useQuery<TextbookReadingProgress>({
    queryKey: ['textbookProgress', subjectId, kind],
    queryFn: () => getReadingProgress(subjectId, kind),
    enabled: !!subjectId,
  });

  async function saveProgress(sectionId: string, paragraphIndex: number) {
    await putReadingProgress(subjectId, kind, { sectionId, paragraphIndex });
    queryClient.invalidateQueries({ queryKey: ['textbookProgress', subjectId, kind] });
  }

  return { ...query, saveProgress };
}

// Same fan-out pattern as useAllSubjectUnits (useCurriculum.ts) — fetches every
// candidate subject's TOC/progress in parallel so the Learn screen's summary
// stats can be computed per mode without a dedicated aggregate endpoint. Query
// keys match the single-subject hooks above so the caches are shared.
export function useAllSubjectTextbookToc(subjects: Subject[] | undefined, kind: TextbookKind, grade?: number) {
  return useQueries({
    queries: (subjects ?? []).map((s) => ({
      queryKey: ['textbookToc', s.id, kind, grade ?? 'all'],
      queryFn: () => getTextbookToc(s.id, kind, grade),
      enabled: !!subjects,
    })),
  });
}

export function useAllSubjectReadingProgress(subjects: Subject[] | undefined, kind: TextbookKind) {
  return useQueries({
    queries: (subjects ?? []).map((s) => ({
      queryKey: ['textbookProgress', s.id, kind],
      queryFn: () => getReadingProgress(s.id, kind),
      enabled: !!subjects,
    })),
  });
}

// "Sections done" has no server-side completion log (UserReadingProgress only
// stores the single most-recent position) — this takes that position's order
// within the subject's grade-scoped TOC as the "how far through" proxy, the
// same spirit as lesson-status completion counts elsewhere in Learn. Subjects
// with zero sections for the given grade are left out of the result entirely,
// matching the "hide, don't show empty" rule already used for the card grid.
//
// isLoading matters here specifically because this fans out one TOC + one
// progress request per subject (unlike Interactive mode's units, which are
// fetched once ungraded and filtered client-side) — while those are still
// settling, every not-yet-arrived subject looks identical to a confirmed-zero
// one unless callers can tell "still finding out" apart from "really empty"
// and hold off on rendering a count or an empty-state message.
export function summarizeReadingProgress(
  subjects: Subject[],
  tocQueries: { data?: TextbookTocUnit[]; isPending: boolean }[],
  progressQueries: { data?: TextbookReadingProgress; isPending: boolean }[]
): { subjectsWithContent: Subject[]; sectionsCompleted: number; sectionsTotal: number; isLoading: boolean } {
  let sectionsCompleted = 0;
  let sectionsTotal = 0;
  const subjectsWithContent: Subject[] = [];

  subjects.forEach((subject, i) => {
    const sections = (tocQueries[i]?.data ?? []).flatMap((u) => u.sections);
    if (sections.length === 0) return;
    subjectsWithContent.push(subject);
    sectionsTotal += sections.length;

    const progress = progressQueries[i]?.data;
    const current = progress ? sections.find((s) => s.id === progress.sectionId) : undefined;
    if (current) sectionsCompleted += current.order + 1;
  });

  const isLoading = tocQueries.some((q) => q.isPending) || progressQueries.some((q) => q.isPending);
  return { subjectsWithContent, sectionsCompleted, sectionsTotal, isLoading };
}
