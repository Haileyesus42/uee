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
  const isDark = t.scheme === 'dark';
  const today = new Date();
  const todayKey = today.toDateString();
  const week = getPastWeek();

  // Amber accent stays the same hue in both themes (matches the Pro badge
  // accent used elsewhere). Everything else is theme-aware — the previous
  // hardcoded #16231F/#5C6B64/#ECE8DD were designed for a pale light-mode
  // card and went fully illegible on dark surface. That's why only the "1"
  // (streakNumber, amber) was visible in dark mode.
  const amber = isDark ? '#F4B740' : '#C98A1A';
  const amberDeep = isDark ? '#F4B740' : '#8A5A00';
  const circleBg = isDark ? 'rgba(244,183,64,0.18)' : '#F6E8C9';
  const circleBorder = isDark ? 'rgba(244,183,64,0.5)' : '#F4B740';
  const todayBg = isDark ? 'rgba(244,183,64,0.24)' : '#FDF3E0';
  const trackColor = isDark ? 'rgba(244,183,64,0.2)' : '#F6E8C9';

  return (
    <View
      style={[
        styles.bottom,
        { backgroundColor: t.colors.surface, borderRadius: t.radius.lg },
        t.shadow.card,
      ]}
    >
      <View style={styles.streakRow}>
        <CircularProgress progress={290 / 360} size={44} strokeWidth={5} color={amber} trackColor={trackColor}>
          <View style={styles.ringIn}>
            <Text style={styles.ringEmoji}>🔥</Text>
          </View>
        </CircularProgress>
        <View style={styles.streakTextCol}>
          <Text style={[styles.streakText, { color: t.colors.textPrimary }]}>
            <Text style={[styles.streakNumber, { color: amber }]}>{streakDays}</Text> day{streakDays === 1 ? '' : 's'} streak
          </Text>
          <Text style={[styles.streakSub, { color: t.colors.textSecondary }]}>
            {streakDays > 0 ? "You're on fire!" : 'Start today'}
          </Text>
        </View>
      </View>

      <View style={[styles.vline2, { backgroundColor: t.colors.border }]} />

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
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: circleBg },
                  // Outside the current streak window — an unfilled ring, not
                  // a filled circle, so it reads as "no record" rather than a
                  // dimmed/failed version of a checkmark.
                  !isToday && !inStreak && {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: circleBorder,
                  },
                  isToday && {
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: todayBg,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: circleBorder,
                  },
                ]}
              >
                {isToday ? (
                  <Text style={styles.dayFlameEmoji}>🔥</Text>
                ) : inStreak ? (
                  <Text style={[styles.dayCheck, { color: amberDeep }]}>✓</Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  { color: isToday ? amber : t.colors.textSecondary },
                ]}
              >
                {label}
              </Text>
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
  // Text colors are set inline (theme-aware); typography stays static here.
  streakText: { fontFamily: 'Inter_700Bold', fontSize: 11.5, fontWeight: '700' },
  streakNumber: { fontSize: 12.5, fontWeight: '800' },
  streakSub: { fontFamily: 'Inter_500Medium', fontSize: 9, fontWeight: '500', marginTop: 1 },
  vline2: { width: 1, height: 32, marginHorizontal: 10, borderRadius: 12 },
  week: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center' },
  dayCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayCheck: { fontWeight: '800', fontSize: 9 },
  dayFlameEmoji: { fontSize: 10 },
  dayLabel: { fontFamily: 'Inter_700Bold', fontSize: 7, fontWeight: '700', marginTop: 3 },
});