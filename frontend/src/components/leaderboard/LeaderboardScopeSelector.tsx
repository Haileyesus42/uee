import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { LeaderboardScope } from '../../data/leaderboard';

const OPTIONS: { key: LeaderboardScope; label: string }[] = [
  { key: 'national', label: '🇪🇹 National' },
  { key: 'school', label: '🏫 My School' },
];

export function LeaderboardScopeSelector({
  scope,
  onChange,
}: {
  scope: LeaderboardScope;
  onChange: (scope: LeaderboardScope) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: t.colors.surfaceAlt }]}>
      {OPTIONS.map((opt) => {
        const active = opt.key === scope;
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
                { color: active ? t.colors.brand : t.colors.textSecondary, fontSize: 11 },
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
  row: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 7 },
  chipActive: {},
});
