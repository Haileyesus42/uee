import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { ProgressBar } from '../progress/ProgressBar';

export type CourseTint = 'brand' | 'warning' | 'success' | 'secondary';

export function CourseCard({
  name,
  icon,
  unitTitle,
  mastery,
  lessonsCompleted,
  lessonsTotal,
  tint,
  onPress,
}: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  unitTitle?: string;
  mastery: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  tint: CourseTint;
  onPress?: () => void;
}) {
  const t = useTheme();
  const tintMap: Record<CourseTint, { bg: string; fg: string }> = {
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
          <Ionicons name={icon} size={16} color={c.fg} />
        </View>
        <Ionicons name="chevron-forward" size={14} color={c.fg} />
      </View>

      <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 8 }]} numberOfLines={1}>
        {name}
      </Text>
      {unitTitle ? (
        <Text style={[styles.unitTitle, { color: c.fg }]} numberOfLines={1}>
          {unitTitle}
        </Text>
      ) : (
        <Text style={[styles.unitTitle, { color: t.colors.textSecondary }]}>No units yet</Text>
      )}

      <View style={{ marginTop: 8 }}>
        <ProgressBar progress={mastery} height={4} color={c.fg} trackColor="rgba(0,0,0,0.08)" />
      </View>
      <Text style={[styles.meta, { color: t.colors.textSecondary }]}>
        {lessonsCompleted}/{lessonsTotal} lessons · {Math.round(mastery * 100)}%
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', borderRadius: 16, padding: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconChip: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  unitTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 10, fontWeight: '600', marginTop: 1 },
  meta: { fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 6 },
});
