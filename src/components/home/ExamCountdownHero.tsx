import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';

// Content-only — no outer gradient/card/shadow. Meant to sit inside the
// hero gradient that HomeScreen renders (which also carries the app bar),
// so this card visually "merges" with it instead of floating separately.
// It sits over the gradient's fade-out zone, which is pale in light mode but
// dark in dark mode — so text/chip colors below switch with the theme
// instead of assuming a light backdrop.
export function ExamCountdownHero({ daysUntilExam }: { daysUntilExam: number }) {
  const t = useTheme();
  const dark = t.scheme === 'dark';
  const ink = dark ? '#F4F1FF' : '#16103C';
  const accent = dark ? '#F5B04E' : '#7C3AED';
  const mutedText = dark ? '#C7C1E0' : '#43406B';
  const faintLine = dark ? 'rgba(255,255,255,0.16)' : 'rgba(225,219,242,0.8)';
  const chipBg = dark ? 'rgba(255,255,255,0.12)' : '#E6DEF9';
  const calendarBg = dark ? '#1D1730' : '#F8F6FD';

  const today = new Date();
  const weekday = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const month = today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return (
    <View>
      <Text style={[styles.spark, { top: 6, left: 22, fontSize: 13 }]}>✦</Text>
      <Text style={[styles.spark, { top: 20, left: 10, fontSize: 8 }]}>✦</Text>
      <Text style={[styles.spark, { top: 70, left: 8, fontSize: 10 }]}>✦</Text>

      <View style={styles.topRow}>
        <View style={styles.heroWrap}>
          <View style={styles.orbit} />
          <View style={styles.heroGlow} />
          <LinearGradient colors={['#9a79f5', '#7a4ff0', '#6a35e6']} style={styles.tile}>
            <Text style={styles.tileEmoji}>⏳</Text>
          </LinearGradient>
        </View>

        <View style={styles.info}>
          <View style={styles.countRow}>
            <Text style={[styles.countValue, { color: ink }]}>{daysUntilExam}</Text>
            <Text style={[styles.countUnit, { color: accent }]}>days</Text>
          </View>
          <Text style={[styles.title, { color: ink }]}>Until Matriculation Exam</Text>
          <View style={styles.miniLine}>
            <View style={[styles.miniLineHalf, { backgroundColor: accent }]} />
            <View style={[styles.miniLineHalf, { backgroundColor: faintLine }]} />
          </View>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: chipBg }]}>
              <Text style={styles.tipEmoji}>🎯</Text>
            </View>
            <Text style={[styles.tipText, { color: mutedText }]}>{'Stay consistent,\nsuccess is near!'}</Text>
          </View>
        </View>

        <View style={[styles.vline, { backgroundColor: faintLine }]} />

        <View style={styles.calendarCol}>
          <View style={[styles.calendar, { backgroundColor: calendarBg }]}>
            <LinearGradient colors={['#7b2ff7', '#5a1cc0']} style={styles.calendarTop}>
              <Text style={styles.calendarWeekday}>{weekday}</Text>
            </LinearGradient>
            <View style={styles.calendarMain}>
              <Text style={[styles.calendarDate, { color: ink }]}>{today.getDate()}</Text>
              <Text style={[styles.calendarMonth, { color: accent }]}>{month}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spark: { position: 'absolute', color: '#FFFFFF' },

  topRow: { flexDirection: 'row', alignItems: 'flex-start' },

  heroWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  orbit: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.55)',
  },
  heroGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3c19aa',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tileEmoji: { fontSize: 20 },

  info: { flex: 1, marginLeft: 8 },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  countValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5, fontWeight: '600' },
  title: { fontFamily: 'Manrope_700Bold', fontSize: 10.5, fontWeight: '700', marginTop: 1 },
  miniLine: { flexDirection: 'row', width: 22, height: 2, borderRadius: 2, overflow: 'hidden', marginTop: 5, marginBottom: 5 },
  miniLineHalf: { flex: 1 },
  tipRow: { flexDirection: 'row', alignItems: 'center' },
  tipIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipEmoji: { fontSize: 9 },
  tipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 8.5,
    marginLeft: 6,
    lineHeight: 11,
    flexShrink: 1,
  },

  vline: { width: 1, height: 72, marginHorizontal: 10 },

  calendarCol: { width: 78, alignItems: 'flex-end' },
  calendar: { width: 72, height: 76, borderRadius: 12, overflow: 'hidden' },
  calendarTop: { paddingVertical: 5, alignItems: 'center' },
  calendarWeekday: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  calendarMain: { alignItems: 'center', paddingVertical: 5 },
  calendarDate: { fontFamily: 'Manrope_800ExtraBold', fontSize: 19, fontWeight: '800' },
  calendarMonth: { fontFamily: 'Inter_700Bold', fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
});
