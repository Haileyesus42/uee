import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkout, getSubscription } from '../api/billing';
import { SubscriptionStatus } from '../api/types';

export function useSubscription() {
  return useQuery<SubscriptionStatus>({ queryKey: ['subscription'], queryFn: getSubscription });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });
}
