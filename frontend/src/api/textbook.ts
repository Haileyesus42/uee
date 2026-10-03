import { apiFetch } from './client';
import {
  TextbookBookmark,
  TextbookHighlight,
  TextbookReadingProgress,
  TextbookSearchResult,
  TextbookSectionDetail,
  TextbookTocUnit,
} from './types';

export function getTextbookToc(subjectId: string, grade?: number): Promise<TextbookTocUnit[]> {
  const query = grade ? `?grade=${grade}` : '';
  return apiFetch(`/textbook/${subjectId}/toc${query}`);
}

export function getTextbookSection(sectionId: string): Promise<TextbookSectionDetail> {
  return apiFetch(`/textbook/sections/${sectionId}`);
}

export function searchTextbook(subjectId: string, q: string): Promise<TextbookSearchResult[]> {
  return apiFetch(`/textbook/${subjectId}/search?q=${encodeURIComponent(q)}`);
}

export function getBookmarks(subjectId?: string): Promise<TextbookBookmark[]> {
  const query = subjectId ? `?subjectId=${subjectId}` : '';
  return apiFetch(`/textbook/bookmarks${query}`);
}

export function createBookmark(sectionId: string): Promise<TextbookBookmark> {
  return apiFetch('/textbook/bookmarks', { method: 'POST', body: { sectionId } });
}

export function deleteBookmark(id: string): Promise<{ ok: true }> {
  return apiFetch(`/textbook/bookmarks/${id}`, { method: 'DELETE' });
}

export function getHighlights(sectionId: string): Promise<TextbookHighlight[]> {
  return apiFetch(`/textbook/highlights?sectionId=${sectionId}`);
}

export function createHighlight(sectionId: string, paragraphIndex: number, note?: string): Promise<TextbookHighlight> {
  return apiFetch('/textbook/highlights', { method: 'POST', body: { sectionId, paragraphIndex, note } });
}

export function deleteHighlight(id: string): Promise<{ ok: true }> {
  return apiFetch(`/textbook/highlights/${id}`, { method: 'DELETE' });
}

export function getReadingProgress(subjectId: string): Promise<TextbookReadingProgress> {
  return apiFetch(`/textbook/${subjectId}/progress`);
}

export function putReadingProgress(
  subjectId: string,
  body: { sectionId: string; paragraphIndex: number }
): Promise<TextbookReadingProgress> {
  return apiFetch(`/textbook/${subjectId}/progress`, { method: 'PUT', body });
}
