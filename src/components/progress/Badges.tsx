import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export function StreakBadge({ days }: { days: number }) {
  const t = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: t.colors.warningLight }]}>
      <Ionicons name="flame" size={14} color={t.colors.streak} />
      <Text style={[t.typography.bodyStrong, { color: t.colors.streak }]}>{days}</Text>
    </View>
  );
}

export function HeartsBadge({ hearts, max = 5 }: { hearts: number; max?: number }) {
  const t = useTheme();
  return (
    <View style={styles.hearts}>
      {Array.from({ length: max }).map((_, i) => (
        <Ionicons key={i} name={i < hearts ? 'heart' : 'heart-outline'} size={16} color={t.colors.error} />
      ))}
    </View>
  );
}

export function XpPill({ xp }: { xp: number }) {
  const t = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: t.colors.brandLight }]}>
      <Text style={[t.typography.bodyStrong, { color: t.colors.brand }]}>+{xp} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  hearts: { flexDirection: 'row', gap: 3 },
});
