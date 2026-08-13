import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { useMe } from '../../hooks/useProfile';
import { useSubjects } from '../../hooks/useCurriculum';
import { Profile, Subject } from '../../api/types';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Achievements'>;

// Every threshold here is checked against real account data (see useMe/useSubjects)
// — no badge is ever marked unlocked without a real signal to back it. A badge with
// no available real signal is left out entirely rather than always-locked filler.
const BADGES: {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isUnlocked: (profile: Profile, subjects: Subject[]) => boolean;
}[] = [
  { id: 'first-lesson', title: 'First Lesson', icon: 'book', isUnlocked: (p) => p.lessonsCompleted >= 1 },
  { id: 'week-streak', title: '7 Day Streak', icon: 'flame', isUnlocked: (p) => p.streakDays >= 7 },
  { id: 'hundred-questions', title: '100 Questions', icon: 'checkmark-done', isUnlocked: (p) => p.questionsSolved >= 100 },
  {
    id: 'perfect-start',
    title: 'Perfect Start',
    icon: 'star',
    isUnlocked: (p) => p.questionsSolved >= 1 && p.accuracy >= 1,
  },
  {
    id: 'subject-mastered',
    title: 'Subject Mastered',
    icon: 'ribbon',
    isUnlocked: (_p, subjects) => subjects.some((s) => s.mastery >= 1),
  },
  {
    id: 'five-subjects',
    title: '5 Subjects Started',
    icon: 'compass',
    isUnlocked: (_p, subjects) => subjects.filter((s) => s.mastery > 0).length >= 5,
  },
  { id: 'uee-challenger', title: 'UEE Challenger', icon: 'shield', isUnlocked: (p) => p.ueeExamsCompleted >= 1 },
  { id: 'month-streak', title: '30 Day Streak', icon: 'trophy', isUnlocked: (p) => p.streakDays >= 30 },
];

export function AchievementsScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: profile } = useMe();
  const { data: subjects } = useSubjects();

  if (!profile || !subjects) return null;

  const badges = BADGES.map((b) => ({ ...b, unlocked: b.isUnlocked(profile, subjects) }));
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Achievements" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 20 }]}>
          {unlockedCount} of {badges.length} unlocked
        </Text>

        <View style={styles.grid}>
          {badges.map((badge) => (
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
