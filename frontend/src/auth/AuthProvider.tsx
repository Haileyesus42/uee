import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { startTelegramLogin, getTelegramLoginStatus, AuthUser } from '../api/auth';
import { getMe } from '../api/profile';
import { clearTokens, getStoredTokens, storeTokens } from '../api/tokenStorage';
import { setSessionExpiredHandler } from '../api/client';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  // Starts a login attempt and returns the loginToken + t.me deep link — the caller
  // is responsible for opening the deep link (Linking.openURL) and for calling
  // pollTelegramLogin afterward to find out when it's been confirmed.
  beginTelegramLogin: () => Promise<{ loginToken: string; deepLink: string }>;
  // Polls until the login is confirmed, times out, or is cancelled — resolves
  // true on success. Safe to call once per login attempt.
  pollTelegramLogin: (loginToken: string) => Promise<boolean>;
  cancelTelegramLogin: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // matches the backend's login-token TTL

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const cancelledRef = useRef(false);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    (async () => {
      const tokens = await getStoredTokens();
      if (!tokens) {
        setStatus('signedOut');
        return;
      }
      try {
        const profile = await getMe();
        setUser({
          id: profile.id,
          telegramId: profile.telegramId,
          telegramUsername: profile.telegramUsername,
          name: profile.name,
          avatarEmoji: profile.avatarEmoji,
          grade: profile.grade,
        });
        setStatus('signedIn');
      } catch {
        setStatus('signedOut');
      }
    })();
  }, []);

  const beginTelegramLogin = useCallback(async () => {
    cancelledRef.current = false;
    return startTelegramLogin();
  }, []);

  const pollTelegramLogin = useCallback(async (loginToken: string) => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (cancelledRef.current) return false;
      const result = await getTelegramLoginStatus(loginToken);
      if (result.status === 'verified') {
        await storeTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
        setUser(result.user);
        setStatus('signedIn');
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    return false;
  }, []);

  const cancelTelegramLogin = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const value = useMemo(
    () => ({ status, user, beginTelegramLogin, pollTelegramLogin, cancelTelegramLogin, logout }),
    [status, user, beginTelegramLogin, pollTelegramLogin, cancelTelegramLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
