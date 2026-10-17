import { apiFetch, apiFetchMultipart } from './client';
import { Mistake, Profile } from './types';

export function getMe(): Promise<Profile> {
  return apiFetch('/me');
}

export function updateMe(body: { name?: string; grade?: number; avatarEmoji?: string }): Promise<Profile> {
  return apiFetch('/me', { method: 'PATCH', body });
}

export async function uploadAvatar(photo: { uri: string; mimeType: string }): Promise<Profile> {
  const form = new FormData();
  form.append('avatar', {
    uri: photo.uri,
    name: `avatar.${photo.mimeType.split('/')[1] ?? 'jpg'}`,
    type: photo.mimeType,
  } as unknown as Blob);

  return apiFetchMultipart('/me/avatar', form);
}

export function removeAvatar(): Promise<Profile> {
  return apiFetch('/me/avatar', { method: 'DELETE' });
}

export function getMistakes(): Promise<Mistake[]> {
  return apiFetch('/me/mistakes');
}
