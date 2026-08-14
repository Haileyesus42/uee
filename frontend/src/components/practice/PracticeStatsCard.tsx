import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../cards/Card';
import { CircularProgress } from '../progress/CircularProgress';

export function PracticeStatsCard({
  accuracy,
  streakDays,
  questionsAnswered,
}: {
  accuracy: number;
  streakDays: number;
  questionsAnswered: number;
}) {
  const t = useTheme();

  return (
    <Card style={styles.card}>
      <CircularProgress progress={accuracy} size={62} strokeWidth={6} color={t.colors.brand}>
        <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{Math.round(accuracy * 100)}%</Text>
      </CircularProgress>

      <View style={styles.statsCol}>
        <View style={styles.statRow}>
          <View style={[styles.statIcon, { backgroundColor: t.colors.warningLight }]}>
            <Ionicons name="flame" size={13} color={t.colors.xp} />
          </View>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8 }]}>
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{streakDays}</Text> day streak
          </Text>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statIcon, { backgroundColor: t.colors.brandLight }]}>
            <Ionicons name="help-circle-outline" size={13} color={t.colors.brand} />
          </View>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8 }]}>
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{questionsAnswered}</Text>{' '}
            questions answered
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
