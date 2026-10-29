import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ChatContext = { questionId?: string; stepId?: string };

type PendingPrompt = { id: number; text: string; context?: ChatContext };

type UnityChatContextValue = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  askUnity: (prompt: string, context?: ChatContext) => void;
  pendingPrompt: PendingPrompt | null;
  clearPendingPrompt: () => void;
};

const UnityChatContext = createContext<UnityChatContextValue | null>(null);

export function UnityChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null);
  const idRef = useRef(0);

  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);

  const askUnity = useCallback((prompt: string, context?: ChatContext) => {
    idRef.current += 1;
    setPendingPrompt({ id: idRef.current, text: prompt, context });
    setOpen(true);
  }, []);

  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), []);

  const value = useMemo(
    () => ({ open, openChat, closeChat, askUnity, pendingPrompt, clearPendingPrompt }),
    [open, openChat, closeChat, askUnity, pendingPrompt, clearPendingPrompt],
  );
  return <UnityChatContext.Provider value={value}>{children}</UnityChatContext.Provider>;
}

export function useUnityChat(): UnityChatContextValue {
  const ctx = useContext(UnityChatContext);
  if (!ctx) throw new Error('useUnityChat must be used within UnityChatProvider');
  return ctx;
}