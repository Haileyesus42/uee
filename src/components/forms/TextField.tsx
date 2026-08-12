import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function TextField({ label, style, ...inputProps }: { label: string } & TextInputProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginBottom: 6 }]}>{label}</Text>
      <TextInput
        placeholderTextColor={t.colors.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={[
          t.typography.body,
          styles.input,
          {
            color: t.colors.textPrimary,
            backgroundColor: t.colors.surface,
            borderColor: focused ? t.colors.brand : t.colors.border,
            borderRadius: t.radius.md,
          },
          style,
        ]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  input: { borderWidth: 1.5, paddingVertical: 13, paddingHorizontal: 14 },
});
