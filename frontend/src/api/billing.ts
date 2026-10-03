import { apiFetch, ApiError, BASE_URL } from './client';
import { getStoredTokens } from './tokenStorage';
import { SubscriptionStatus, TelebirrInfo, TelebirrSubmission, TelebirrSubmissionStatus } from './types';

export function checkout(plan: 'monthly' | 'yearly'): Promise<{ redirectUrl: string | null; activated: boolean }> {
  return apiFetch('/billing/checkout', { method: 'POST', body: { plan } });
}

export function getSubscription(): Promise<SubscriptionStatus> {
  return apiFetch('/billing/subscription');
}

export function getTelebirrInfo(): Promise<TelebirrInfo> {
  return apiFetch('/billing/telebirr/info');
}

export function getLatestTelebirrSubmission(): Promise<{ submission: TelebirrSubmission | null }> {
  return apiFetch('/billing/telebirr/latest');
}

// Bypasses apiFetch: that helper always sends JSON (Content-Type + JSON.stringify
// body), but this needs a multipart upload instead. React Native's fetch builds
// the multipart body and boundary itself from a FormData — setting Content-Type
// manually here would drop the boundary and break parsing server-side, so it's
// deliberately left unset.
export async function submitTelebirrPayment(
  plan: 'monthly' | 'yearly',
  screenshot: { uri: string; mimeType: string }
): Promise<{ status: TelebirrSubmissionStatus; reviewNote: string | null }> {
  const tokens = await getStoredTokens();
  if (!tokens) throw new ApiError(401, 'Not signed in');

  const form = new FormData();
  form.append('plan', plan);
  form.append('screenshot', {
    uri: screenshot.uri,
    name: `screenshot.${screenshot.mimeType.split('/')[1] ?? 'jpg'}`,
    type: screenshot.mimeType,
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/billing/telebirr/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    body: form,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload.error ?? 'Submission failed');
  return payload;
}
