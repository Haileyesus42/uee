import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, getMistakes, removeAvatar, updateMe, uploadAvatar } from '../api/profile';
import { Mistake, Profile } from '../api/types';

export function useMe() {
  return useQuery<Profile>({ queryKey: ['me'], queryFn: getMe });
}

export function useMistakes() {
  return useQuery<Mistake[]>({ queryKey: ['mistakes'], queryFn: getMistakes });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (profile) => queryClient.setQueryData(['me'], profile),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (profile) => queryClient.setQueryData(['me'], profile),
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: (profile) => queryClient.setQueryData(['me'], profile),
  });
}
