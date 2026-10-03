import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBookmark,
  createHighlight,
  deleteBookmark,
  deleteHighlight,
  getBookmarks,
  getHighlights,
  getReadingProgress,
  getTextbookSection,
  getTextbookToc,
  putReadingProgress,
  searchTextbook,
} from '../api/textbook';
import {
  TextbookBookmark,
  TextbookHighlight,
  TextbookReadingProgress,
  TextbookSearchResult,
  TextbookSectionDetail,
  TextbookTocUnit,
} from '../api/types';

export function useTextbookToc(subjectId: string, grade?: number) {
  return useQuery<TextbookTocUnit[]>({
    queryKey: ['textbookToc', subjectId, grade ?? 'all'],
    queryFn: () => getTextbookToc(subjectId, grade),
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
  return { search: (subjectId: string, q: string): Promise<TextbookSearchResult[]> => searchTextbook(subjectId, q) };
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

export function useReadingProgress(subjectId: string) {
  const queryClient = useQueryClient();
  const query = useQuery<TextbookReadingProgress>({
    queryKey: ['textbookProgress', subjectId],
    queryFn: () => getReadingProgress(subjectId),
    enabled: !!subjectId,
  });

  async function saveProgress(sectionId: string, paragraphIndex: number) {
    await putReadingProgress(subjectId, { sectionId, paragraphIndex });
    queryClient.invalidateQueries({ queryKey: ['textbookProgress', subjectId] });
  }

  return { ...query, saveProgress };
}
