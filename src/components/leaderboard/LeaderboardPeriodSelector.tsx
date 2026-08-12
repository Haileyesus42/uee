import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { LeaderboardPeriod } from '../../data/leaderboard';

const OPTIONS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'allTime', label: 'All-time' },
];

export function LeaderboardPeriodSelector({
  period,
  onChange,
}: {
  period: LeaderboardPeriod;
  onChange: (period: LeaderboardPeriod) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: t.colors.surfaceAlt }]}>
      {OPTIONS.map((opt) => {
        const active = opt.key === period;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.chip,
              active && [styles.chipActive, { backgroundColor: t.colors.surface }, t.shadow.card],
            ]}
          >
            <Text
              style={[
                t.typography.bodyStrong,
                { color: active ? t.colors.brand : t.colors.textSecondary, fontSize: 12 },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  chipActive: {},
});
