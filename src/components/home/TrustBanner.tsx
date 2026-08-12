import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export function TrustBanner() {
  const t = useTheme();
  const gradientColors: [string, string] =
    t.scheme === 'dark' ? ['#2b1d52', '#171030'] : ['#fff8ea', '#fffdf8'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={[styles.trophy, { backgroundColor: t.colors.brandLight }]}>
        <Text style={styles.trophyEmoji}>🏆</Text>
      </View>

      <Text style={[styles.heading, { color: t.colors.textPrimary }]}>
        <Text style={{ color: t.colors.highlight }}>20+ Years</Text> of UEE Examination
      </Text>

      <View style={[styles.trust, { backgroundColor: t.colors.chip, borderColor: t.colors.chipBorder }]}>
        <Ionicons name="shield-checkmark" size={20} color={t.colors.brand} />
        <Text style={[styles.trustTitle, { color: t.colors.textPrimary }]}>Trusted by thousands</Text>
      </View>
    </LinearGradient>
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
    maxWidth: 150,
  },
  trustTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 10.5, fontWeight: '700', lineHeight: 14 },
});
