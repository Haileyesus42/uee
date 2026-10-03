import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatHistory, sendChatMessage } from '../api/chat';
import { ChatMessage } from '../api/types';

export function useChatHistory() {
  return useQuery<ChatMessage[]>({ queryKey: ['chat-history'], queryFn: getChatHistory });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => sendChatMessage(text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-history'] }),
  });
}
