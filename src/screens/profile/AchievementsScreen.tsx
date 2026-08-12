import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Achievements'>;

const BADGES: { id: string; title: string; icon: keyof typeof Ionicons.glyphMap; unlocked: boolean }[] = [
  { id: 'first-lesson', title: 'First Lesson', icon: 'book', unlocked: true },
  { id: 'week-streak', title: '7 Day Streak', icon: 'flame', unlocked: true },
  { id: 'hundred-questions', title: '100 Questions', icon: 'checkmark-done', unlocked: true },
  { id: 'perfect-lesson', title: 'Perfect Lesson', icon: 'star', unlocked: true },
  { id: 'ten-topics', title: '10 Topics Mastered', icon: 'ribbon', unlocked: false },
  { id: 'fixed-fifty', title: 'Fixed 50 Mistakes', icon: 'construct', unlocked: false },
  { id: 'uee-challenger', title: 'UEE Challenger', icon: 'shield', unlocked: false },
  { id: 'month-streak', title: '30 Day Streak', icon: 'trophy', unlocked: false },
];

export function AchievementsScreen({ navigation }: Props) {
  const t = useTheme();
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Achievements" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 20 }]}>
          {unlockedCount} of {BADGES.length} unlocked
        </Text>

        <View style={styles.grid}>
          {BADGES.map((badge) => (
            <View
              key={badge.id}
              style={[
                styles.badge,
                { backgroundColor: badge.unlocked ? t.colors.brandLight : t.colors.surfaceAlt },
              ]}
            >
              <View style={[styles.iconChip, { backgroundColor: badge.unlocked ? t.colors.brand : t.colors.locked }]}>
                <Ionicons name={badge.icon} size={20} color={t.colors.textInverse} />
              </View>
              <Text
                style={[
                  t.typography.caption,
                  { color: badge.unlocked ? t.colors.textPrimary : t.colors.textSecondary, marginTop: 8, textAlign: 'center' },
                ]}
              >
                {badge.title}
              </Text>
              {!badge.unlocked && <Ionicons name="lock-closed" size={12} color={t.colors.textSecondary} style={styles.lock} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badge: { width: '30.5%', borderRadius: 14, padding: 12, alignItems: 'center' },
  iconChip: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lock: { position: 'absolute', top: 8, right: 8 },
});
