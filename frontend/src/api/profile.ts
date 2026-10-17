import { apiFetch, ApiError, BASE_URL } from './client';
import { getStoredTokens } from './tokenStorage';
import { Mistake, Profile } from './types';

export function getMe(): Promise<Profile> {
  return apiFetch('/me');
}

export function updateMe(body: { name?: string; grade?: number; avatarEmoji?: string }): Promise<Profile> {
  return apiFetch('/me', { method: 'PATCH', body });
}

// Bypasses apiFetch for the same reason submitTelebirrPayment does — needs a
// multipart body, which React Native's fetch builds (with the right boundary)
// straight from a FormData. Setting Content-Type manually would drop that
// boundary and break parsing server-side.
export async function uploadAvatar(photo: { uri: string; mimeType: string }): Promise<Profile> {
  const tokens = await getStoredTokens();
  if (!tokens) throw new ApiError(401, 'Not signed in');

  const form = new FormData();
  form.append('avatar', {
    uri: photo.uri,
    name: `avatar.${photo.mimeType.split('/')[1] ?? 'jpg'}`,
    type: photo.mimeType,
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    body: form,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload.error ?? 'Upload failed');
  return payload;
}

export function removeAvatar(): Promise<Profile> {
  return apiFetch('/me/avatar', { method: 'DELETE' });
}

export function getMistakes(): Promise<Mistake[]> {
  return apiFetch('/me/mistakes');
}
