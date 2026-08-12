import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

// Base surface all other cards build on — keeps radius/shadow/padding consistent app-wide.
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: t.colors.surface,
          borderColor: t.colors.border,
          borderRadius: t.radius.lg,
          padding: padded ? t.spacing.md : 0,
        },
        t.shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 0 },
});
