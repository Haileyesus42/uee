import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

// "11 Years" matches the real archive: 2013–2018 and 2021–2025 (~9,700
// questions, verified against the database). 2004–2012 and 2019–2020 are
// still gaps — bump this number if/when either one lands.
export function TrustBanner({ onPress }: { onPress?: () => void }) {
  const t = useTheme();
  const gradientColors: [string, string] =
    t.scheme === 'dark' ? ['#2b1d52', '#171030'] : ['#fff8ea', '#fffdf8'];

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.banner, t.shadow.raised, pressed && { opacity: 0.9 }]}
        >
          <View style={[styles.trophy, { backgroundColor: t.colors.brandLight }]}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>

          <Text style={[styles.heading, { color: t.colors.textPrimary }]}>
            <Text style={{ color: t.colors.highlight }}>11 Years</Text> of UEE Examination
          </Text>

          <View style={[styles.trust, { backgroundColor: t.colors.chip, borderColor: t.colors.chipBorder }]}>
            <Ionicons name="shield-checkmark" size={20} color={t.colors.brand} />
            <Text style={[styles.trustTitle, { color: t.colors.textPrimary }]}>Real UEE Exams</Text>
          </View>

          {onPress && <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} style={styles.chevron} />}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, gap: 12 },
  trophy: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  trophyEmoji: { fontSize: 28 },
  heading: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14.5,
    fontWeight: '800',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    maxWidth: 128,
  },
  chevron: { marginLeft: 2 },
  trustTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 10.5, fontWeight: '700', lineHeight: 14 },
});
