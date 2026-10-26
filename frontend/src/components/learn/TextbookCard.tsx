import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { CourseTint } from './CourseCard';

// Sibling to CourseCard but deliberately not the same component — CourseCard's
// "N/M lessons · X%" footer is lesson-completion semantics that don't apply to
// reading content (there's no "mastery" of having read a chapter).
export function TextbookCard({
  name,
  icon,
  tint,
  onPress,
}: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
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
      <Text style={[styles.hint, { color: c.fg }]}>Read the full textbook</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', borderRadius: 16, padding: 12, minHeight: 150, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconChip: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: 'Inter_600SemiBold', fontSize: 10, fontWeight: '600', marginTop: 1 },
});
