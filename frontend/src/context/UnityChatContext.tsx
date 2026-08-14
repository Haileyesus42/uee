import React, { createContext, useContext, useMemo, useState } from 'react';

type UnityChatContextValue = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
};

const UnityChatContext = createContext<UnityChatContextValue | null>(null);

// Lets any screen — deep inside any tab's stack, not just MainTabNavigator
// itself — open the floating Unity chat panel without threading callbacks
// through navigation params.
export function UnityChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({ open, openChat: () => setOpen(true), closeChat: () => setOpen(false) }),
    [open]
  );
  return <UnityChatContext.Provider value={value}>{children}</UnityChatContext.Provider>;
}

export function useUnityChat(): UnityChatContextValue {
  const ctx = useContext(UnityChatContext);
  if (!ctx) throw new Error('useUnityChat must be used within UnityChatProvider');
  return ctx;
}
