import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { useSubjects } from '../../hooks/useCurriculum';
import { useMe } from '../../hooks/useProfile';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Statistics'>;

function formatStudyTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function StatisticsScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: subjects } = useSubjects();
  const { data: profile } = useMe();
  const tintMap = {
    brand: { bg: t.colors.brandLight, fg: t.colors.brand },
    warning: { bg: t.colors.warningLight, fg: t.colors.warning },
    success: { bg: t.colors.successLight, fg: t.colors.success },
  } as const;

  if (!subjects || !profile) return null;

  const OVERVIEW = [
    { icon: 'list-outline' as const, value: String(profile.questionsSolved), label: 'Questions Solved', tint: 'brand' as const },
    { icon: 'checkmark-circle-outline' as const, value: `${Math.round(profile.accuracy * 100)}%`, label: 'Accuracy', tint: 'success' as const },
    { icon: 'time-outline' as const, value: formatStudyTime(profile.studyTimeSeconds), label: 'Study Time', tint: 'warning' as const },
  ];
  const weakest = [...subjects].sort((a, b) => a.mastery - b.mastery)[0];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Statistics" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <View style={styles.overviewRow}>
          {OVERVIEW.map((stat, i) => {
            const tint = tintMap[stat.tint];
            return (
              <View
                key={stat.label}
                style={[
                  styles.overviewTile,
                  { backgroundColor: t.colors.surface },
                  i < OVERVIEW.length - 1 && styles.overviewSpacing,
                ]}
              >
                <View style={[styles.iconChip, { backgroundColor: tint.bg }]}>
                  <Ionicons name={stat.icon} size={15} color={tint.fg} />
                </View>
                <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginTop: 8 }]}>{stat.value}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>
                  {stat.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginTop: 28, marginBottom: 14 }]}>
          Subject Mastery
        </Text>
        {subjects.map((subject) => (
          <View key={subject.id} style={styles.masteryRow}>
            <View style={styles.masteryHeader}>
              <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{subject.name}</Text>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
                {Math.round(subject.mastery * 100)}%
              </Text>
            </View>
            <ProgressBar progress={subject.mastery} height={6} />
          </View>
        ))}

        <View style={[styles.insightCard, { backgroundColor: t.colors.brandLight, marginTop: 20 }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={16} color={t.colors.brand} />
            <Text style={[t.typography.bodyStrong, { color: t.colors.brand, marginLeft: 6 }]}>Smart Insight</Text>
          </View>
          <Text style={[t.typography.body, { color: t.colors.textPrimary, marginTop: 6 }]}>
            {weakest.name} is your weakest subject at {Math.round(weakest.mastery * 100)}% mastery — a few
            focused practice sessions will move the needle fast.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overviewRow: { flexDirection: 'row' },
  overviewTile: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'flex-start' },
  overviewSpacing: { marginRight: 10 },
  iconChip: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  masteryRow: { marginBottom: 16 },
  masteryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  insightCard: { borderRadius: 14, padding: 14 },
  insightHeader: { flexDirection: 'row', alignItems: 'center' },
});
