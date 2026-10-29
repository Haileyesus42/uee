import { apiFetch } from './client';
import { ChatMessage } from './types';

export type ChatContext = {
  questionId?: string;
  stepId?: string;
};

export function getChatHistory(): Promise<ChatMessage[]> {
  return apiFetch('/chat/messages');
}

export function sendChatMessage(
  text: string,
  context?: ChatContext,
): Promise<ChatMessage> {
  return apiFetch('/chat/messages', { method: 'POST', body: { text, context } });
}