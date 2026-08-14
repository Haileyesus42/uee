import React, { createContext, useContext } from 'react';

type OnboardingFlow = { complete: () => void };

const OnboardingFlowContext = createContext<OnboardingFlow | null>(null);

export function OnboardingFlowProvider({ complete, children }: { complete: () => void; children: React.ReactNode }) {
  return <OnboardingFlowContext.Provider value={{ complete }}>{children}</OnboardingFlowContext.Provider>;
}

export function useOnboardingFlow(): OnboardingFlow {
  const ctx = useContext(OnboardingFlowContext);
  if (!ctx) throw new Error('useOnboardingFlow must be used within OnboardingFlowProvider');
  return ctx;
}
