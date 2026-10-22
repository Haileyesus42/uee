import { apiFetch } from './client';
import {
  TextbookBookmark,
  TextbookEdition,
  TextbookHighlight,
  TextbookKind,
  TextbookReadingProgress,
  TextbookSearchResult,
  TextbookSectionDetail,
  TextbookTocUnit,
} from './types';

export function getTextbookToc(subjectId: string, kind: TextbookKind, grade?: number): Promise<TextbookTocUnit[]> {
  const params = new URLSearchParams({ kind });
  if (grade) params.set('grade', String(grade));
  return apiFetch(`/textbook/${subjectId}/toc?${params.toString()}`);
}

export function getTextbookSection(sectionId: string): Promise<TextbookSectionDetail> {
  return apiFetch(`/textbook/sections/${sectionId}`);
}

export function getTextbookEdition(subjectId: string, kind: TextbookKind): Promise<TextbookEdition> {
  return apiFetch(`/textbook/${subjectId}/edition?${new URLSearchParams({ kind }).toString()}`);
}

export function searchTextbook(subjectId: string, kind: TextbookKind, q: string): Promise<TextbookSearchResult[]> {
  return apiFetch(`/textbook/${subjectId}/search?${new URLSearchParams({ q, kind }).toString()}`);
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

export function getReadingProgress(subjectId: string, kind: TextbookKind): Promise<TextbookReadingProgress> {
  return apiFetch(`/textbook/${subjectId}/progress?${new URLSearchParams({ kind }).toString()}`);
}

export function putReadingProgress(
  subjectId: string,
  kind: TextbookKind,
  body: { sectionId: string; paragraphIndex: number }
): Promise<TextbookReadingProgress> {
  return apiFetch(`/textbook/${subjectId}/progress`, { method: 'PUT', body: { ...body, kind } });
}
