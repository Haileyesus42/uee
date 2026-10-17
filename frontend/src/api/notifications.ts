import { apiFetch } from './client';
import { AppNotification } from './types';

export function getNotifications(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  return apiFetch('/me/notifications');
}

export function markAllNotificationsRead(): Promise<{ ok: true }> {
  return apiFetch('/me/notifications/read-all', { method: 'POST' });
}
