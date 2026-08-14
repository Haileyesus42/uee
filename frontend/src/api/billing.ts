import { apiFetch } from './client';
import { SubscriptionStatus } from './types';

export function checkout(plan: 'monthly' | 'yearly'): Promise<{ redirectUrl: string | null; activated: boolean }> {
  return apiFetch('/billing/checkout', { method: 'POST', body: { plan } });
}

export function getSubscription(): Promise<SubscriptionStatus> {
  return apiFetch('/billing/subscription');
}
