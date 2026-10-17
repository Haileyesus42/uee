import { apiFetch, apiFetchMultipart } from './client';
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

export async function submitTelebirrPayment(
  plan: 'monthly' | 'yearly',
  screenshot: { uri: string; mimeType: string }
): Promise<{ status: TelebirrSubmissionStatus; reviewNote: string | null }> {
  const form = new FormData();
  form.append('plan', plan);
  form.append('screenshot', {
    uri: screenshot.uri,
    name: `screenshot.${screenshot.mimeType.split('/')[1] ?? 'jpg'}`,
    type: screenshot.mimeType,
  } as unknown as Blob);

  return apiFetchMultipart('/billing/telebirr/submit', form);
}
