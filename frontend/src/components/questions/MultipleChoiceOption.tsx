import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { MathText } from '../common/MathText';

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

export function MultipleChoiceOption({
  label,
  state,
  onPress,
}: {
  label: string;
  state: OptionState;
  onPress?: () => void;
}) {
  const t = useTheme();

  const palette: Record<OptionState, { border: string; bg: string; text: string }> = {
    default: { border: t.colors.border, bg: t.colors.surface, text: t.colors.textPrimary },
    selected: { border: t.colors.brand, bg: t.colors.brandLight, text: t.colors.textPrimary },
    correct: { border: t.colors.success, bg: t.colors.successLight, text: t.colors.textPrimary },
    incorrect: { border: t.colors.error, bg: t.colors.errorLight, text: t.colors.textPrimary },
  };
  const c = palette[state];

  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'correct' || state === 'incorrect'}
      style={[styles.row, { borderColor: c.border, backgroundColor: c.bg, borderRadius: t.radius.md }]}
    >
      <MathText style={[styles.label, { color: c.text }]}>{label}</MathText>
      {state === 'correct' && <Ionicons name="checkmark-circle" size={20} color={t.colors.success} />}
      {state === 'incorrect' && <Ionicons name="close-circle" size={20} color={t.colors.error} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1.5,
  paddingVertical: 14,
  paddingHorizontal: 16,
  minHeight: 56,
  marginBottom: 8,
},
  label: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 21, flex: 1 },
});
