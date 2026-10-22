import { useQuery, useQueryClient } from '@tanstack/react-query';
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
