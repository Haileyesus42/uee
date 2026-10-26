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
// Decorative sparkles. Kept left of x≈46 (the countdown text starts around
// x≈66) so they never sit under the number or the motivational line.
const SPARKS = [
  { top: 6, left: 22, size: 13, opacity: 1 },
  { top: 20, left: 10, size: 8, opacity: 0.9 },
  { top: 70, left: 8, size: 10, opacity: 0.85 },
  { top: 2, left: 42, size: 7, opacity: 0.75 },
  { top: 34, left: 38, size: 5, opacity: 0.6 },
  { top: 52, left: 2, size: 5, opacity: 0.5 },
  { top: 92, left: 30, size: 6, opacity: 0.7 },
  { top: 110, left: 12, size: 7, opacity: 0.55 },
];

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
      {SPARKS.map((s, i) => (
        <Text
          key={i}
          style={[styles.spark, { top: s.top, left: s.left, fontSize: s.size, opacity: s.opacity }]}
        >
          ✦
        </Text>
      ))}

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
            <Text style={styles.countValue}>{daysUntilExam}</Text>
            <Text style={styles.countUnit}>days left</Text>
          </View>
          <View style={styles.miniLine}>
            <View style={[styles.miniLineHalf, { backgroundColor: accent }]} />
            <View style={[styles.miniLineHalf, { backgroundColor: faintLine }]} />
          </View>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: chipBg }]}>
              <Text style={styles.tipEmoji}>🎯</Text>
            </View>
            <Text style={[styles.tipText, { color: mutedText }]}>Stay consistent</Text>
          </View>
        </View>

        <View style={[styles.vline, { backgroundColor: faintLine }]} />

        <View style={styles.calendarCol}>
          <View style={[styles.calendarShadow, { backgroundColor: calendarBg }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  // White stars sit on purple, but the lowest ones reach the pale fade zone —
  // the shadow keeps them from disappearing into a near-white backdrop.
  spark: {
    position: 'absolute',
    color: '#FFFFFF',
    textShadowColor: 'rgba(74,44,160,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

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
  // The card's top row sits over the gradient's mid-purple band, where both
  // dark ink and the purple accent lose contrast — so the count is white with
  // a soft shadow to hold its edge as the backdrop fades to pale further down.
  countValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(38,15,96,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  countUnit: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EDE7FF',
    textShadowColor: 'rgba(38,15,96,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  miniLine: { flexDirection: 'row', width: 22, height: 2, borderRadius: 2, overflow: 'hidden', marginTop: 6, marginBottom: 6 },
  miniLineHalf: { flex: 1 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  tipIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipEmoji: { fontSize: 12 },
  tipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 7,
    lineHeight: 16,
    flexShrink: 1,
  },

  vline: { width: 1, height: 84, marginHorizontal: 10 },

  calendarCol: { width: 78, alignItems: 'flex-end' },
  // Shadow lives on a wrapper: the inner calendar clips its gradient with
  // overflow:'hidden', which would otherwise clip the shadow too.
  calendarShadow: {
    borderRadius: 12,
    shadowColor: '#3c19aa',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  calendar: { width: 72, height: 70, borderRadius: 12, overflow: 'hidden' },
  calendarTop: { paddingVertical: 4, alignItems: 'center' },
  calendarWeekday: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  calendarMain: { alignItems: 'center', paddingVertical: 4 },
  calendarDate: { fontFamily: 'Manrope_800ExtraBold', fontSize: 19, fontWeight: '800' },
  calendarMonth: { fontFamily: 'Inter_700Bold', fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
});
