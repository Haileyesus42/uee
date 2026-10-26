import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircularProgress } from '../progress/CircularProgress';
import { useTheme } from '../../theme/ThemeProvider';

const DAY_MS = 86400000;

function getPastWeek(): Date[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => new Date(today.getTime() - (6 - i) * DAY_MS));
}

export function StreakWeekBar({ streakDays }: { streakDays: number }) {
  const t = useTheme();
  const today = new Date();
  const todayKey = today.toDateString();
  const week = getPastWeek();

  return (
    <View
      style={[
        styles.bottom,
        { backgroundColor: t.colors.surface, borderRadius: t.radius.lg },
        t.shadow.card,
      ]}
    >
      <View style={styles.streakRow}>
        <CircularProgress progress={290 / 360} size={44} strokeWidth={5} color="#7c3aed" trackColor="#E4DEFA">
          <View style={styles.ringIn}>
            <Text style={styles.ringEmoji}>🔥</Text>
          </View>
        </CircularProgress>
        <View style={styles.streakTextCol}>
          <Text style={styles.streakText}>
            <Text style={styles.streakNumber}>{streakDays}</Text> day{streakDays === 1 ? '' : 's'} streak
          </Text>
          <Text style={styles.streakSub}>{streakDays > 0 ? "You're on fire!" : 'Start today'}</Text>
        </View>
      </View>

      <View style={styles.vline2} />

      <View style={styles.week}>
        {week.map((date, i) => {
          const isToday = date.toDateString() === todayKey;
          // i=6 is today (see getPastWeek) — daysAgo counts back from there. A day
          // is part of the CURRENT streak only if it falls within the most recent
          // `streakDays` consecutive days, derived from the same trusted counter
          // the headline number uses — not assumed true for every past cell.
          const daysAgo = 6 - i;
          const inStreak = daysAgo >= 1 && daysAgo <= streakDays - 1;
          const label = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          return (
            <View key={i} style={styles.dayCol}>
              <View style={[styles.dayCircle, isToday && styles.dayCircleToday, !isToday && !inStreak && styles.dayCircleEmpty]}>
                {isToday ? (
                  <Text style={styles.dayFlameEmoji}>🔥</Text>
                ) : inStreak ? (
                  <Text style={styles.dayCheck}>✓</Text>
                ) : null}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakRow: { flexDirection: 'row', alignItems: 'center' },
  ringIn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  ringEmoji: { fontSize: 15 },
  streakTextCol: { marginLeft: 8 },
  streakText: { fontFamily: 'Inter_700Bold', fontSize: 11.5, fontWeight: '700', color: '#16103C' },
  streakNumber: { color: '#7C3AED', fontSize: 12.5 },
  streakSub: { fontFamily: 'Inter_500Medium', fontSize: 9, fontWeight: '500', color: '#6B6890', marginTop: 1 },
  vline2: { width: 1, height: 32, backgroundColor: '#DDD6F0', marginHorizontal: 10, borderRadius: 12 },
  week: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center' },
  dayCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E4DEFA', alignItems: 'center', justifyContent: 'center' },
  // Outside the current streak window — an unfilled ring, not a filled circle,
  // so it reads as "no record" rather than a dimmed/failed version of a checkmark.
  dayCircleEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E4DEFA' },
  dayCircleToday: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F6F1FE',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A78BFA',
  },
  dayCheck: { color: '#6D3BE0', fontWeight: '800', fontSize: 9 },
  dayFlameEmoji: { fontSize: 10 },
  dayLabel: { fontFamily: 'Inter_700Bold', fontSize: 7, fontWeight: '700', color: '#6B6890', marginTop: 3 },
  dayLabelToday: { color: '#7C3AED' },
});
