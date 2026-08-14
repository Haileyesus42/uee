import { apiFetch } from './client';

export type AuthUser = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  name: string;
  avatarEmoji: string;
  grade: number;
};

export type StartTelegramLoginResult = { loginToken: string; deepLink: string };

export type TelegramLoginStatus =
  | { status: 'pending' }
  | { status: 'verified'; accessToken: string; refreshToken: string; user: AuthUser };

export function startTelegramLogin(): Promise<StartTelegramLoginResult> {
  return apiFetch('/auth/telegram/start', { method: 'POST', auth: false });
}

export function getTelegramLoginStatus(loginToken: string): Promise<TelegramLoginStatus> {
  return apiFetch(`/auth/telegram/status/${loginToken}`, { auth: false });
}
