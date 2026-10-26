import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../cards/Card';
import { CircularProgress } from '../progress/CircularProgress';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getCurrentWeekdayIndex(): number {
  return (new Date().getDay() + 6) % 7; // 0 = Monday
}

export function TodaysGoalCard({
  minutesDone,
  minutesGoal,
  streakDays,
  xpEarned,
  level,
  levelTitle,
}: {
  minutesDone: number;
  minutesGoal: number;
  streakDays: number;
  xpEarned: number;
  level: number;
  levelTitle: string;
}) {
  const t = useTheme();
  const progress = Math.min(1, minutesDone / minutesGoal);
  const todayIndex = getCurrentWeekdayIndex();
  // Days before today, this calendar week, that are part of the current streak.
  // Capped at todayIndex (days before today, since the streak can't extend past
  // Monday within this one displayed week) — unlike a plain `i < streakDays`
  // check, this can never mark a day after today as done.
  const daysBeforeTodayInStreak = Math.max(0, Math.min(streakDays - 1, todayIndex));

  return (
    <Card style={styles.card}>
      <Text style={[styles.heading, { color: t.colors.textPrimary }]}>Today's Goal</Text>

      <View style={styles.goalRow}>
        <CircularProgress progress={progress} size={86} strokeWidth={9} color={t.colors.brand} trackColor={t.colors.track}>
          <Text style={[styles.ringValue, { color: t.colors.textPrimary }]}>{minutesDone}</Text>
          <Text style={[styles.ringLabel, { color: t.colors.textSecondary }]}>/{minutesGoal} min</Text>
        </CircularProgress>

        <View style={styles.week}>
          <Text style={[styles.weekMessage, { color: t.colors.textSecondary }]}>
            {streakDays >= 3 ? 'Great progress!' : 'Keep going!'}
          </Text>
          <View style={styles.days}>
            {DAY_LABELS.map((label, i) => {
              const isToday = i === todayIndex;
              const done = i < daysBeforeTodayInStreak;
              return (
                <View key={i} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dot,
                      { borderColor: t.colors.track },
                      done && { backgroundColor: t.colors.brand, borderColor: t.colors.brand },
                      isToday && { borderColor: t.colors.brand },
                    ]}
                  >
                    {done && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                    {isToday && <View style={[styles.nowDot, { backgroundColor: t.colors.brand }]} />}
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: isToday ? t.colors.brand : t.colors.textSecondary },
                      isToday && styles.dayLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.statsRow, { borderTopColor: t.colors.border }]}>
        <View style={styles.stat}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={[styles.statValue, { color: t.colors.textPrimary }]}>{xpEarned.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: t.colors.textSecondary }]}>XP Earned</Text>
        </View>
        <View style={[styles.stat, styles.statDivider, { borderLeftColor: t.colors.border }]}>
          <Text style={styles.statEmoji}>🛡️</Text>
          <Text style={[styles.statValue, { color: t.colors.textPrimary }]}>Level {level}</Text>
          <Text style={[styles.statLabel, { color: t.colors.textSecondary }]}>{levelTitle}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  heading: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, fontWeight: '800', marginBottom: 14 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 20, fontWeight: '800' },
  ringLabel: { fontFamily: 'Inter_400Regular', fontSize: 9.5 },
  week: { flex: 1 },
  weekMessage: { fontFamily: 'Inter_400Regular', fontSize: 11.5, marginBottom: 9 },
  days: { flexDirection: 'row', gap: 7 },
  dayCol: { alignItems: 'center', gap: 4 },
  dot: { width: 23, height: 23, borderRadius: 11.5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nowDot: { width: 7, height: 7, borderRadius: 3.5 },
  dayLabel: { fontFamily: 'Inter_400Regular', fontSize: 9.5 },
  dayLabelActive: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginTop: 14, paddingTop: 13, borderTopWidth: 1 },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1 },
  statEmoji: { fontSize: 20 },
  statValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 16, fontWeight: '800', marginTop: 3, marginBottom: 2 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
});
