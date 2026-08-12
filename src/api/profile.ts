import { apiFetch } from './client';
import { Mistake, Profile } from './types';

export function getMe(): Promise<Profile> {
  return apiFetch('/me');
}

export function updateMe(body: { name?: string; grade?: number; avatarEmoji?: string }): Promise<Profile> {
  return apiFetch('/me', { method: 'PATCH', body });
}

export function getMistakes(): Promise<Mistake[]> {
  return apiFetch('/me/mistakes');
}
