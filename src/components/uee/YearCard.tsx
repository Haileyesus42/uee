import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export type YearCardTint = 'brand' | 'warning' | 'success' | 'secondary';

export function YearCard({
  year,
  subjectCount,
  tint,
  onPress,
}: {
  year: number;
  subjectCount: number;
  tint: YearCardTint;
  onPress?: () => void;
}) {
  const t = useTheme();
  const tintMap: Record<YearCardTint, { bg: string; fg: string }> = {
    brand: { bg: t.colors.brandLight, fg: t.colors.brand },
    warning: { bg: t.colors.warningLight, fg: t.colors.warning },
    success: { bg: t.colors.successLight, fg: t.colors.success },
    secondary: { bg: t.colors.secondaryLight, fg: t.colors.secondary },
  };
  const c = tintMap[tint];

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: c.bg }, t.shadow.card]}>
      <View style={styles.topRow}>
        <View style={[styles.iconChip, { backgroundColor: t.colors.surface }]}>
          <Ionicons name="document-text-outline" size={16} color={c.fg} />
        </View>
        <Ionicons name="chevron-forward" size={14} color={c.fg} />
      </View>
      <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginTop: 10 }]}>{year}</Text>
      <Text style={[styles.meta, { color: c.fg }]}>{subjectCount} subjects</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', borderRadius: 16, padding: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconChip: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  meta: { fontFamily: 'Inter_600SemiBold', fontSize: 11, fontWeight: '600', marginTop: 2 },
});
