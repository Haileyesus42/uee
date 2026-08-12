import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export type PracticeModeTint = 'brand' | 'warning' | 'success';

export function PracticeModeCard({
  title,
  subtitle,
  meta,
  icon,
  tint,
  onPress,
}: {
  title: string;
  subtitle: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: PracticeModeTint;
  onPress?: () => void;
}) {
  const t = useTheme();
  const tintMap: Record<PracticeModeTint, { bg: string; fg: string }> = {
    brand: { bg: t.colors.brandLight, fg: t.colors.brand },
    warning: { bg: t.colors.warningLight, fg: t.colors.warning },
    success: { bg: t.colors.successLight, fg: t.colors.success },
  };
  const c = tintMap[tint];

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: c.bg }, t.shadow.card]}>
      <View style={[styles.iconChip, { backgroundColor: t.colors.surface }]}>
        <Ionicons name={icon} size={22} color={c.fg} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{title}</Text>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>
        <View style={[styles.metaChip, { backgroundColor: t.colors.surface }]}>
          <Text style={[styles.metaText, { color: c.fg }]}>{meta}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14 },
  iconChip: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  metaChip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  metaText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, fontWeight: '600' },
});
