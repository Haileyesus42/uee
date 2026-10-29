import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export type FeatureId = 'courses' | 'quiz' | 'mock' | 'uee';

const FEATURES: { id: FeatureId; title: string; icon: keyof typeof Ionicons.glyphMap; descLight: string; descDark: string }[] = [
  {
    id: 'courses',
    title: 'Courses',
    icon: 'school',
    descLight: 'Step-by-step lessons',
    descDark: 'Step-by-step lessons',
  },
  {
    id: 'quiz',
    title: 'Practice',
    icon: 'help-circle',
    descLight: 'Practice question types',
    descDark: 'Practice question types',
  },
  {
    id: 'mock',
    title: 'Model Exams',
    icon: 'timer',
    descLight: 'Simulate real UEE exams',
    descDark: 'Simulate real UEE exams',
  },
  {
    id: 'uee',
    title: 'UEE Exams',
    icon: 'document-text',
    descLight: 'Past questions & solutions',
    descDark: 'Past questions & solutions',
  },
];

const LIGHT_TINTS: Record<FeatureId, { bg: string; gradient: [string, string]; arrowBg: string; iconC: string }> = {
  courses: { bg: '#E0F0EA', gradient: ['#3FA381', '#0B5E4B'], arrowBg: '#CBE6DB', iconC: '#0B5E4B' },
  quiz: { bg: '#FDF3E0', gradient: ['#F6D68F', '#D9A441'], arrowBg: '#F6D68F', iconC: '#8A5A00' },
  mock: { bg: '#E7ECEC', gradient: ['#4A7A7C', '#0E2A2B'], arrowBg: '#CBD9D9', iconC: '#0E2A2B' },
  uee: { bg: '#E9F1FB', gradient: ['#8AB9F0', '#2F6BB0'], arrowBg: '#C9DEFA', iconC: '#2F6BB0' },
};

export function FeatureGrid({ onPressItem }: { onPressItem?: (id: FeatureId) => void }) {
  const t = useTheme();
  const isDark = t.scheme === 'dark';

  return (
    <View style={styles.grid}>
      {FEATURES.map((f) => {
        const tint = LIGHT_TINTS[f.id];
        const cardBg = isDark ? t.colors.surface : tint.bg;

        return (
          <Pressable
            key={f.id}
            onPress={() => onPressItem?.(f.id)}
            style={({ pressed }) => [styles.card, { backgroundColor: cardBg }, t.shadow.card, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.topRow}>
              <LinearGradient colors={tint.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.iconBadge, t.shadow.card]}>
                <Ionicons name={f.icon} size={23} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.title, { color: t.colors.textPrimary }]}>{f.title}</Text>
            </View>

            <Text style={[styles.desc, { color: t.colors.textSecondary }]}>
              {isDark ? f.descDark : f.descLight}
            </Text>

            <View style={[styles.arrow, { backgroundColor: isDark ? tint.gradient[1] + '40' : tint.arrowBg }]}>
              <Ionicons name="arrow-forward" size={16} color={isDark ? '#FFFFFF' : tint.iconC} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  // flexBasis + flexGrow: cards start at 47% and grow to fill the row evenly.
  // The old `width: '47%'` left ~9px of unused space on the right edge because
  // 2×47% + 12px gap ≠ 100% of the container. Flex-grow distributes that
  // leftover space equally, so both cards end flush with the container edges.
  card: { flexBasis: '47%', flexGrow: 1, borderRadius: 16, padding: 16, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 14.5, fontWeight: '800' },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 17 },
  arrow: { alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});