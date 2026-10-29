import { useEffect } from 'react';
import { apiFetch } from '../api/client';
import { showMotivationNotification } from '../lib/notifications';

type Motivation = {
  type: 'countdown' | 'lesson' | 'practice' | 'exam' | 'quote';
  emoji: string;
  title: string;
  message: string;
};

/**
 * Fires one Android system notification per app cold-start with a
 * personalized message from the backend's /me/motivation priority chain.
 *
 * The once-per-session guard lives inside showMotivationNotification()
 * (module-level flag in notifications.ts) — this hook just fetches and
 * passes through, so it's safe even if the component remounts.
 */
export function useMotivationNotification(daysUntilExam: number | null) {
  useEffect(() => {
    let cancelled = false;

    const qs =
      daysUntilExam !== null && daysUntilExam >= 0
        ? `?daysUntilExam=${daysUntilExam}`
        : '';

    apiFetch<Motivation>(`/me/motivation${qs}`)
      .then((res) => {
        if (cancelled) return;
        showMotivationNotification({
          title: res.title,
          message: res.message,
          type: res.type,
        });
      })
      .catch(() => {
        // Silent — a broken motivation fetch must never break app start.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only — no deps, so it fires exactly once per app process
}