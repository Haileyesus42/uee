import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type PendingPrompt = { id: number; text: string };

type UnityChatContextValue = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  /**
   * Open the panel and immediately ask `prompt` — behaves identically to the
   * user typing it into the input and pressing send, but fired automatically.
   * Any screen can call this (e.g. "Ask Unity" from a question explanation).
   */
  askUnity: (prompt: string) => void;
  /** Panel-internal: the prompt awaiting auto-send, if any. */
  pendingPrompt: PendingPrompt | null;
  /** Panel-internal: clears the pending prompt after it's been sent. */
  clearPendingPrompt: () => void;
};

const UnityChatContext = createContext<UnityChatContextValue | null>(null);

// Lets any screen — deep inside any tab's stack, not just MainTabNavigator
// itself — open the floating Unity chat panel without threading callbacks
// through navigation params.
export function UnityChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null);
  const idRef = useRef(0);

  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);

  const askUnity = useCallback((prompt: string) => {
    // Monotonic id makes each ask a distinct object reference, so the panel's
    // effect fires even when the user asks the same question twice in a row.
    idRef.current += 1;
    setPendingPrompt({ id: idRef.current, text: prompt });
    setOpen(true);
  }, []);

  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), []);

  const value = useMemo(
    () => ({ open, openChat, closeChat, askUnity, pendingPrompt, clearPendingPrompt }),
    [open, openChat, closeChat, askUnity, pendingPrompt, clearPendingPrompt]
  );
  return <UnityChatContext.Provider value={value}>{children}</UnityChatContext.Provider>;
}

export function useUnityChat(): UnityChatContextValue {
  const ctx = useContext(UnityChatContext);
  if (!ctx) throw new Error('useUnityChat must be used within UnityChatProvider');
  return ctx;
}