import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { requestOtp as apiRequestOtp, verifyOtp as apiVerifyOtp, AuthUser } from '../api/auth';
import { getMe } from '../api/profile';
import { clearTokens, getStoredTokens, storeTokens } from '../api/tokenStorage';
import { setSessionExpiredHandler } from '../api/client';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

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
          phone: profile.phone,
          telegramId: null,
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

  const requestOtp = useCallback(async (phone: string) => {
    await apiRequestOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await apiVerifyOtp(phone, code);
    await storeTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
    setStatus('signedIn');
  }, []);

  const value = useMemo(
    () => ({ status, user, requestOtp, verifyOtp, logout }),
    [status, user, requestOtp, verifyOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
