import { clearTokens, getStoredTokens, storeTokens } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Set by AuthProvider on mount — lets the client react to a definitively-expired
// session (refresh also failed) without an import cycle back into AuthProvider.
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) return null;
    const next = (await res.json()) as { accessToken: string; refreshToken: string };
    await storeTokens(next);
    return next.accessToken;
  } catch {
    return null;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // defaults to true — set false for the OTP request/verify calls
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  async function send(accessToken: string | null): Promise<Response> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  const tokens = auth ? await getStoredTokens() : null;
  let res = await send(tokens?.accessToken ?? null);

  if (res.status === 401 && auth && tokens) {
    if (!refreshInFlight) refreshInFlight = refreshAccessToken().finally(() => (refreshInFlight = null));
    const newAccessToken = await refreshInFlight;

    if (newAccessToken) {
      res = await send(newAccessToken);
    } else {
      await clearTokens();
      onSessionExpired?.();
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, payload.error ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
