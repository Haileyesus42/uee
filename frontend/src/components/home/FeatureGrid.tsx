import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export type FeatureId = 'courses' | 'quiz' | 'mock' | 'uee';

const FEATURES: { id: FeatureId; title: string; emoji?: string; descLight: string; descDark: string }[] = [
  {
    id: 'courses',
    title: 'Courses',
    emoji: '🎓',
    descLight: 'Step-by-step lessons',
    descDark: 'Step-by-step lessons',
  },
  {
    id: 'quiz',
    title: 'Quiz Modes',
    emoji: '🎯',
    descLight: 'Practice question types',
    descDark: 'Practice question types',
  },
  {
    id: 'mock',
    title: 'Mock Exams',
    emoji: '📋',
    descLight: 'Simulate real UEE exams',
    descDark: 'Simulate real UEE exams',
  },
  {
    id: 'uee',
    title: 'UEE Exams',
    descLight: 'Past questions & solutions',
    descDark: 'Past questions & solutions',
  },
];

const LIGHT_TINTS: Record<FeatureId, { bg: string; arrowBg: string; arrowC: string }> = {
  courses: { bg: '#F3EDFC', arrowBg: '#E3D9FA', arrowC: '#6D4DED' },
  quiz: { bg: '#FDF3E0', arrowBg: '#F6D68F', arrowC: '#7A5A12' },
  mock: { bg: '#EDF7EE', arrowBg: '#CDEAD4', arrowC: '#2F7D4F' },
  uee: { bg: '#E9F1FB', arrowBg: '#C9DEFA', arrowC: '#2F6BB0' },
};

export function FeatureGrid({ onPressItem }: { onPressItem?: (id: FeatureId) => void }) {
  const t = useTheme();
  const isDark = t.scheme === 'dark';

  return (
    <View style={styles.grid}>
      {FEATURES.map((f) => {
        const tint = isDark
          ? { bg: t.colors.surface, arrowBg: 'rgba(255,255,255,0.07)', arrowC: '#cfc9e8' }
          : LIGHT_TINTS[f.id];

        return (
          <Pressable
            key={f.id}
            onPress={() => onPressItem?.(f.id)}
            style={({ pressed }) => [styles.card, { backgroundColor: tint.bg }, t.shadow.card, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.topRow}>
              {f.id === 'uee' ? (
                <LinearGradient colors={['#8a5cff', '#5b2fe0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bookBadge}>
                  <Text style={styles.bookText}>UEE</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.emoji}>{f.emoji}</Text>
              )}
              <Text style={[styles.title, { color: t.colors.textPrimary }]}>{f.title}</Text>
            </View>

            <Text style={[styles.desc, { color: t.colors.textSecondary }]}>
              {isDark ? f.descDark : f.descLight}
            </Text>

            <View style={[styles.arrow, { backgroundColor: tint.arrowBg }]}>
              <Ionicons name="arrow-forward" size={16} color={tint.arrowC} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderRadius: 16, padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 30 },
  bookBadge: { width: 40, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bookText: { color: '#ffd76a', fontFamily: 'Inter_700Bold', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 14.5, fontWeight: '800' },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 17 },
  arrow: { alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
