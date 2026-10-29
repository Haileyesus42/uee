import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api/client';

export type Motivation = {
  type: 'countdown' | 'lesson' | 'practice' | 'exam' | 'quote';
  emoji: string;
  title: string;
  message: string;
};

// Module-level session state. Resets when the app process is killed, which
// is exactly what "once per app-opening session" means — not once per
// navigation, not once per foreground transition.
let shownThisSession = false;
let cachedMessage: Motivation | null = null;

export function useMotivation(daysUntilExam: number | null) {
  const [message, setMessage] = useState<Motivation | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Already displayed once this session → no fetch, no re-show.
    if (shownThisSession) return;

    // Cached from earlier in the same session (unlikely — shownThisSession
    // would already be true — but defensive) → show cached.
    if (cachedMessage) {
      setMessage(cachedMessage);
      shownThisSession = true;
      return;
    }

    const qs =
      daysUntilExam !== null && daysUntilExam >= 0
        ? `?daysUntilExam=${daysUntilExam}`
        : '';

    apiFetch<Motivation>(`/me/motivation${qs}`)
      .then((res) => {
        if (!mounted.current) return;
        cachedMessage = res;
        setMessage(res);
        shownThisSession = true;
      })
      .catch(() => {
        // Silent — a broken motivation fetch must never break Home.
      });

    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    setMessage(null);
    // Don't clear cachedMessage — it stays "shown" for the rest of the session.
  }, []);

  return { message, dismiss };
}

// Test helper — should only be called from tests or dev menus.
export function __resetMotivationSessionForTests() {
  shownThisSession = false;
  cachedMessage = null;
}