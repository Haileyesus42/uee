import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {ChatContext,  getChatHistory, sendChatMessage } from '../api/chat';
import { ChatMessage } from '../api/types';


export function useChatHistory() {
  return useQuery<ChatMessage[]>({ queryKey: ['chat-history'], queryFn: getChatHistory });
}


export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, context }: { text: string; context?: ChatContext }) =>
      sendChatMessage(text, context),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-history'] }),
  });
}