import { apiFetch } from './client';

export type AuthUser = {
  id: string;
  phone: string;
  telegramId: string | null;
  name: string;
  avatarEmoji: string;
  grade: number;
};

export type VerifyResult = { accessToken: string; refreshToken: string; user: AuthUser };

export function requestOtp(phone: string): Promise<{ ok: true }> {
  return apiFetch('/auth/otp/request', { method: 'POST', body: { phone }, auth: false });
}

export function verifyOtp(phone: string, code: string): Promise<VerifyResult> {
  return apiFetch('/auth/otp/verify', { method: 'POST', body: { phone, code }, auth: false });
}
