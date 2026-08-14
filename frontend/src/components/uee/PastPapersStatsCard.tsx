import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../cards/Card';

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: t.colors.brandLight }]}>
        <Ionicons name={icon} size={15} color={t.colors.brand} />
      </View>
      <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginTop: 8 }]}>{value}</Text>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function PastPapersStatsCard({
  years,
  subjectsPerYear,
}: {
  years: number;
  subjectsPerYear: number;
}) {
  const t = useTheme();
  return (
    <Card style={styles.card}>
      <Stat icon="calendar-outline" value={String(years)} label="Years" />
      <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
      <Stat icon="school-outline" value={String(subjectsPerYear)} label="Subjects" />
      <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
      <Stat icon="document-text-outline" value={String(years * subjectsPerYear)} label="Papers" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 40 },
});
