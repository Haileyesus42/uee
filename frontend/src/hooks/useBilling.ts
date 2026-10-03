import { Linking } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkout, getLatestTelebirrSubmission, getSubscription, getTelebirrInfo, submitTelebirrPayment } from '../api/billing';
import { SubscriptionStatus } from '../api/types';

export function useSubscription() {
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    // Real Chapa checkouts activate asynchronously from a server-to-server webhook
    // (see backend/src/modules/billing/routes.ts), not from this response — poll
    // while pending so PremiumScreen flips to "Pro" on its own once the webhook
    // lands, without the user needing to pull-to-refresh.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkout,
    onSuccess: (result) => {
      // Mock provider activates immediately with no redirectUrl; real Chapa
      // returns its hosted checkout page, which the user completes outside the
      // app (browser/mobile-money app) — activation itself still only ever
      // happens from the signed webhook, never from this redirect.
      if (result.redirectUrl) Linking.openURL(result.redirectUrl);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useTelebirrInfo() {
  return useQuery({ queryKey: ['telebirrInfo'], queryFn: getTelebirrInfo });
}

export function useLatestTelebirrSubmission() {
  return useQuery({
    queryKey: ['telebirrSubmission'],
    queryFn: getLatestTelebirrSubmission,
    // Approval is normally synchronous (the submit call itself resolves with the
    // final status) — this only keeps polling for the needs_review case, where a
    // human has to look before it resolves to approved/rejected.
    refetchInterval: (query) => (query.state.data?.submission?.status === 'needs_review' ? 4000 : false),
  });
}

export function useSubmitTelebirrPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plan, screenshot }: { plan: 'monthly' | 'yearly'; screenshot: { uri: string; mimeType: string } }) =>
      submitTelebirrPayment(plan, screenshot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telebirrSubmission'] });
      // Harmless no-op when the submission wasn't auto-approved — 'active'-or-not
      // is exactly what this query already represents, so re-checking it is the
      // simplest way for PremiumScreen to flip to Pro the moment approval happens.
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
