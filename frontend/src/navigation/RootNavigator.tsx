import React from 'react';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { UnityChatProvider } from '../context/UnityChatContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export function RootNavigator() {
  const t = useTheme();
  const { status } = useAuth();

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

  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: t.colors.brand }} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <UnityChatProvider>
        {status === 'signedIn' ? <MainTabNavigator /> : <OnboardingNavigator onComplete={() => {}} />}
      </UnityChatProvider>
    </NavigationContainer>
  );
}
