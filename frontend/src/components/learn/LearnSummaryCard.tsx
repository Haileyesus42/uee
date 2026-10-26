import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../cards/Card';
import { CircularProgress } from '../progress/CircularProgress';

export function LearnSummaryCard({
  avgMastery,
  courseCount,
  lessonsCompleted,
  secondaryLabel = 'lessons done',
  secondaryIcon = 'checkmark-done-outline',
}: {
  avgMastery: number;
  courseCount: number;
  lessonsCompleted: number;
  secondaryLabel?: string;
  secondaryIcon?: keyof typeof Ionicons.glyphMap;
}) {
  const t = useTheme();

  return (
    <Card style={styles.card}>
      <CircularProgress progress={avgMastery} size={62} strokeWidth={6} color={t.colors.brand}>
        <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{Math.round(avgMastery * 100)}%</Text>
      </CircularProgress>

      <View style={styles.statsCol}>
        <View style={styles.statRow}>
          <View style={[styles.statIcon, { backgroundColor: t.colors.brandLight }]}>
            <Ionicons name="school-outline" size={13} color={t.colors.brand} />
          </View>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8 }]}>
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{courseCount}</Text> courses
          </Text>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statIcon, { backgroundColor: t.colors.successLight }]}>
            <Ionicons name={secondaryIcon} size={13} color={t.colors.success} />
          </View>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8 }]}>
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{lessonsCompleted}</Text>{' '}
            {secondaryLabel}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center' },
  statsCol: { marginLeft: 16, gap: 10 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
