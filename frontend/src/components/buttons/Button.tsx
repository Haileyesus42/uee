import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size = 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  fullWidth = true,
  style,
}: Props) {
  const t = useTheme();

  const backgrounds: Record<Variant, string> = {
    primary: t.colors.brand,
    secondary: t.colors.surfaceAlt,
    tertiary: 'transparent',
    destructive: t.colors.error,
  };
  const textColors: Record<Variant, string> = {
    primary: t.colors.textInverse,
    secondary: t.colors.textPrimary,
    tertiary: t.colors.brand,
    destructive: t.colors.textInverse,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: backgrounds[variant] },
        fullWidth && styles.fullWidth,
        variant === 'tertiary' && { borderWidth: 0 },
        (disabled || pressed) && { opacity: disabled ? 0.5 : 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[t.typography.button, { color: textColors[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { paddingVertical: 10, paddingHorizontal: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 20 },
  fullWidth: { alignSelf: 'stretch' },
});
