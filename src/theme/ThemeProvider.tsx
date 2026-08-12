import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { color, Colors, ColorScheme, radius, spacing, typography, shadow } from './tokens';

type Theme = {
  scheme: ColorScheme;
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: typeof shadow;
  toggleScheme: () => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children, forceScheme }: { children: React.ReactNode; forceScheme?: ColorScheme }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<ColorScheme | null>(forceScheme ?? null);
  const scheme: ColorScheme = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const value = useMemo<Theme>(
    () => ({
      scheme,
      colors: color[scheme],
      spacing,
      radius,
      typography,
      shadow,
      toggleScheme: () => setOverride(scheme === 'dark' ? 'light' : 'dark'),
    }),
    [scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
