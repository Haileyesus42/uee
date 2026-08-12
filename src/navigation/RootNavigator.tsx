import React, { useState } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { UnityChatProvider } from '../context/UnityChatContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export function RootNavigator() {
  const t = useTheme();
  const [onboarded, setOnboarded] = useState(false);

  const navTheme = {
    ...(t.scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: t.colors.brand,
      background: t.colors.bg,
      card: t.colors.surface,
      text: t.colors.textPrimary,
      border: t.colors.border,
      notification: t.colors.error,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <UnityChatProvider>
        {onboarded ? <MainTabNavigator /> : <OnboardingNavigator onComplete={() => setOnboarded(true)} />}
      </UnityChatProvider>
    </NavigationContainer>
  );
}
