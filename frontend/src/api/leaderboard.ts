import { apiFetch } from './client';
import { LeaderboardPeriod, LeaderboardResponse, LeaderboardScope } from '../data/leaderboard';

export type SchoolSearchResult = {
  id: string;
  name: string;
  region: string;
  city: string | null;
};

export type SchoolSearchResponse = {
  schools: SchoolSearchResult[];
};

export function getLeaderboard(
  period: LeaderboardPeriod,
  scope: LeaderboardScope,
): Promise<LeaderboardResponse> {
  return apiFetch(`/leaderboard?period=${period}&scope=${scope}`);
}

export function searchSchools(q: string): Promise<SchoolSearchResponse> {
  return apiFetch(`/schools/search?q=${encodeURIComponent(q)}`);
}

export function joinSchool(schoolId: string): Promise<{ ok: boolean }> {
  return apiFetch('/me/school', { method: 'POST', body: { schoolId } });
}

export function leaveSchool(): Promise<{ ok: boolean }> {
  return apiFetch('/me/school', { method: 'DELETE' });
}

export function submitSchoolRequest(body: {
  name: string;
  region: string;
  city?: string;
}): Promise<{ ok: boolean; requestId: string; status: string }> {
  return apiFetch('/schools/requests', { method: 'POST', body });
}