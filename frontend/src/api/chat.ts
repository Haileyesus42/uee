import { apiFetch } from './client';
import { ChatMessage } from './types';

export function getChatHistory(): Promise<ChatMessage[]> {
  return apiFetch('/chat/messages');
}

export function sendChatMessage(text: string): Promise<ChatMessage> {
  return apiFetch('/chat/messages', { method: 'POST', body: { text } });
}
