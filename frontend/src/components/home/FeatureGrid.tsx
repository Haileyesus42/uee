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
    title: 'Quiz Modes',
    icon: 'help-circle',
    descLight: 'Practice question types',
    descDark: 'Practice question types',
  },
  {
    id: 'mock',
    title: 'Mock Exams',
    // Timer, not a generic document — a mock exam's defining trait is the
    // timed, real-condition simulation, not just "more questions."
    icon: 'timer',
    descLight: 'Simulate real UEE exams',
    descDark: 'Simulate real UEE exams',
  },
  {
    id: 'uee',
    title: 'UEE Exams',
    // Matches the bottom UEE tab's own icon exactly — this card and that tab
    // open the same screen, so the repeated icon is a deliberate "same place"
    // signal rather than a clash.
    icon: 'document-text',
    descLight: 'Past questions & solutions',
    descDark: 'Past questions & solutions',
  },
];

// A filled icon on a gradient badge reads as more crafted/expressive than a
// thin outline glyph on a flat tint, in both themes — only the card's own
// background switches (pale per-feature tint in light, neutral surface in
// dark). Gradient pairs are the existing arrow colors (darker stop) lightened
// for the other stop, not new unrelated colors — "quiz" reuses the exact gold
// already used for the Pro badge elsewhere in the app.
const LIGHT_TINTS: Record<FeatureId, { bg: string; gradient: [string, string]; arrowBg: string; iconC: string }> = {
  courses: { bg: '#F3EDFC', gradient: ['#A98FF5', '#6D4DED'], arrowBg: '#E3D9FA', iconC: '#6D4DED' },
  quiz: { bg: '#FDF3E0', gradient: ['#F6D68F', '#D9A441'], arrowBg: '#F6D68F', iconC: '#7A5A12' },
  mock: { bg: '#EDF7EE', gradient: ['#7FD9A0', '#2F7D4F'], arrowBg: '#CDEAD4', iconC: '#2F7D4F' },
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
              {/* Same vivid gradient badge in both themes — a flat low-opacity
                  white tile against a dark card read as barely-there, which is
                  the opposite of "expressive." A saturated badge has its own
                  contrast regardless of theme, so it doesn't need a muted
                  dark-mode fallback the way flat-tint fills did. */}
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
  card: { width: '47%', borderRadius: 16, padding: 16, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 14.5, fontWeight: '800' },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 17 },
  arrow: { alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
