import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { useMotivation } from '../../hooks/useMotivation';
import { MotivationBanner } from '../../components/home/MotivationBanner';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/cards/Card';
import { ExamCountdownHero } from '../../components/home/ExamCountdownHero';
import { StreakWeekBar } from '../../components/home/StreakWeekBar';
import { ContinueLearningCard } from '../../components/home/ContinueLearningCard';
import { TrustBanner } from '../../components/home/TrustBanner';
import { FeatureGrid, FeatureId } from '../../components/home/FeatureGrid';
import { TodaysGoalCard } from '../../components/home/TodaysGoalCard';
import { SmartInsightCard } from '../../components/home/SmartInsightCard';
import { useMe } from '../../hooks/useProfile';
import { useNotifications } from '../../hooks/useNotifications';
import { useAllSubjectUnits, useSubjects } from '../../hooks/useCurriculum';
import { useSubscription } from '../../hooks/useBilling';
import { HomeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeDashboard'>,
  BottomTabScreenProps<MainTabParamList>
>;

// The Matriculation (UEE) exam is always on 4 June. Count to the next one, so
// the number stays correct across years instead of being hardcoded.
function daysUntilMatriculation(now: Date = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = new Date(startOfToday.getFullYear(), 5, 4);
  const target =
    thisYear < startOfToday ? new Date(startOfToday.getFullYear() + 1, 5, 4) : thisYear;
  return Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
}

// The next lesson to resume is the first "current" lesson found across subjects, in
// subject-list order — every subject has at most one (see the linear-unlock logic in
// backend/src/modules/curriculum/routes.ts), so this picks the first one going.
//
// Returns `undefined` while subjects/units are still loading, and `null` only
// once every subject's units have actually loaded and genuinely none has a
// "current" lesson (every lesson everywhere is complete) — these must stay
// distinct, or the screen would flash an "all caught up" empty state on every
// normal page load before data arrives, not just on real completion.
function useContinueLearning() {
  const { data: subjects } = useSubjects();
  const unitQueries = useAllSubjectUnits(subjects);
  if (!subjects) return undefined;

  let allUnitsLoaded = true;
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    const units = unitQueries[i]?.data;
    if (!units) {
      allUnitsLoaded = false;
      continue;
    }
    for (const unit of units) {
      const lessonIndex = unit.lessons.findIndex((l) => l.status === 'current');
      if (lessonIndex === -1) continue;
      const lesson = unit.lessons[lessonIndex];
      return {
        subjectId: subject.id,
        unitId: unit.id,
        lessonId: lesson.id,
        subjectName: subject.name,
        lessonTitle: lesson.title,
        lessonPosition: lessonIndex + 1,
        lessonCount: unit.lessons.length,
        // Fraction of THIS unit's lessons already completed (lessonIndex is
        // 0-based, so "Lesson 2 of 3" → 1/3) — matches what "Lesson 2 of 3"
        // already implies, not lesson-internal or subject-wide progress.
        progress: lessonIndex / unit.lessons.length,
      };
    }
  }
  return allUnitsLoaded ? null : undefined;
}

// Shown in place of ContinueLearningCard once every subject's lessons are
// completed — useContinueLearning() returns null then, which previously left
// this slot blank with no indication the empty state was deliberate.
function AllCaughtUpCard() {
  const t = useTheme();
  const daysToExam = daysUntilMatriculation();
const { message: motivation, dismiss: dismissMotivation } = useMotivation(daysToExam);
  return (
    <View>
      <Text style={[caughtUpStyles.sectionLabel, { color: t.colors.brand }]}>Continue Learning</Text>
      <Card style={caughtUpStyles.card}>
        <Text style={caughtUpStyles.emoji}>🎉</Text>
        <View style={caughtUpStyles.textCol}>
          <Text style={[caughtUpStyles.title, { color: t.colors.textPrimary }]}>You're all caught up</Text>
          <Text style={[caughtUpStyles.meta, { color: t.colors.textSecondary }]}>
            Every lesson is complete — check Practice for more.
          </Text>
        </View>
      </Card>
    </View>
  );
}

const caughtUpStyles = StyleSheet.create({
  sectionLabel: { fontFamily: 'Manrope_700Bold', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  emoji: { fontSize: 28 },
  textCol: { flex: 1, marginLeft: 12 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 13, fontWeight: '800' },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
});

export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMe();
  const { data: notificationsData } = useNotifications();
  const { data: subscription } = useSubscription();
  const isPro = subscription?.status === 'active';
  const continueLearning = useContinueLearning();
  const { data: subjectsForInsight } = useSubjects();
  const weakestSubject = subjectsForInsight?.length
    ? [...subjectsForInsight].sort((a, b) => a.mastery - b.mastery)[0]
    : null;

  // Hero has a dark purple gradient, so the status bar needs light icons
  // while Home is focused — reverts automatically when another tab focuses.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, [])
  );

  function handleFeaturePress(id: FeatureId) {
    if (id === 'courses') navigation.navigate('Learn', { screen: 'LearnHome' });
    else if (id === 'uee') navigation.navigate('Uee', { screen: 'StreamSelect' });
    else if (id === 'mock') navigation.navigate('Practice', { screen: 'MockExamsList' });
    else navigation.navigate('Practice', { screen: 'PracticeHub' });
  }

  // The top of the gradient stays a fixed brand purple in both themes, but it
  // has to fade OUT into whatever the page background actually is — a fixed
  // near-white last stop looked fine in light mode (which is also pale) but
  // cut hard against the dark theme's near-black background.
  const heroColors: [string, string, string, string, string] =
    t.scheme === 'dark'
      ? ['#0B5E4B', '#156654', '#1C4F47', '#15393A', t.colors.bg]
      : ['#0B5E4B', '#1C7A63', '#6FA996', '#DCEDE6', '#FAF9F6'];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={[]}>
      <LinearGradient
        colors={heroColors}
        locations={[0, 0.2, 0.42, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.4 }}
        style={[styles.hero, { paddingTop: insets.top + 4 }]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Ionicons name="book" size={20} color="#FFFFFF" />
            <Text style={styles.brandText}>Tizata</Text>
            {/* Status lives in the wordmark, not as a competing CTA — tap still
                opens the same Premium screen the old standalone button did. */}
            <Pressable
              onPress={() => navigation.navigate('Profile', { screen: 'Premium' })}
              hitSlop={8}
              style={[styles.statusBadge, isPro && styles.statusBadgePro]}
            >
              {isPro && <Ionicons name="checkmark-circle" size={10} color="#FFE3A3" style={styles.statusBadgeIcon} />}
              <Text style={[styles.statusBadgeText, isPro && styles.statusBadgeTextPro]}>{isPro ? 'PRO' : 'Free'}</Text>
            </Pressable>
          </View>
          <View style={styles.topBarRight}>
            <Pressable onPress={t.toggleScheme} hitSlop={8} style={styles.themeToggle}>
              {/* Sun/moon reflects the current theme, not a swapped-icon bug —
                  the color is the part that has to adapt. A hardcoded white
                  nearly disappeared here: this sits on the hero gradient's
                  right edge, which (like ExamCountdownHero's own ink color
                  just below) fades pale in light mode but stays dark in dark
                  mode — the opposite of the logo's corner, which is dark-ish
                  in both themes. */}
              <Ionicons
                name={t.scheme === 'dark' ? 'moon' : 'sunny-outline'}
                size={16}
                color={t.scheme === 'dark' ? '#F4F1EA' : '#16231F'}
              />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile', { screen: 'ProfileHome' })}>
              <Avatar
                userId={profile?.id ?? ''}
                hasPhoto={profile?.hasAvatarPhoto ?? false}
                emoji={profile?.avatarEmoji ?? '🧑🎓'}
                size={40}
                dot={(notificationsData?.unreadCount ?? 0) > 0}
                onDotPress={() => navigation.navigate('Notifications')}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroContent}>
          {motivation && (
  <MotivationBanner motivation={motivation} onDismiss={dismissMotivation} />
)}
          <ExamCountdownHero daysUntilExam={daysUntilMatriculation()} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl, gap: 12 }}>
        <StreakWeekBar streakDays={profile?.streakDays ?? 0} />
        {continueLearning === null && <AllCaughtUpCard />}
        {continueLearning && (
          <ContinueLearningCard
            subject={continueLearning.subjectName}
            lessonTitle={continueLearning.lessonTitle}
            lessonPosition={continueLearning.lessonPosition}
            lessonCount={continueLearning.lessonCount}
            progress={continueLearning.progress}
            onPress={() =>
              navigation.navigate('Learn', {
                screen: 'Lesson',
                params: {
                  subjectId: continueLearning.subjectId,
                  unitId: continueLearning.unitId,
                  lessonId: continueLearning.lessonId,
                },
              })
            }
          />
        )}
        <TrustBanner onPress={() => navigation.navigate('Uee', { screen: 'StreamSelect' })} />
        <FeatureGrid onPressItem={handleFeaturePress} />
        <TodaysGoalCard
          minutesDone={12}
          minutesGoal={15}
          streakDays={profile?.streakDays ?? 0}
          xpEarned={profile?.xp ?? 0}
          level={profile?.level ?? 1}
          levelTitle={profile?.levelTitle ?? 'New Learner'}
        />
        {weakestSubject && (
          <SmartInsightCard
            message={
              weakestSubject.mastery > 0
                ? `${weakestSubject.name} is weakest at ${Math.round(weakestSubject.mastery * 100)}% mastery.`
                : `You haven't started ${weakestSubject.name} yet.`
            }
            ctaLabel={`Study ${weakestSubject.name} →`}
            onPress={() => navigation.navigate('Learn', { screen: 'SubjectPath', params: { subjectId: weakestSubject.id } })}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandText: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 7,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Glass-chip treatment matches ExamCountdownHero's tipIcon/chipBg below —
  // same translucent-white-on-purple language, scaled down for a tag that
  // reads as part of the logo lockup rather than a second call to action.
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  statusBadgePro: { backgroundColor: 'rgba(246,214,143,0.24)' },
  statusBadgeIcon: { marginRight: 2 },
  statusBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  statusBadgeTextPro: { color: '#FFE3A3' },
  themeToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  // `hero` has no explicit height — it's sized from its own content. A
  // `flex: 1` here would try to grow to fill the parent's available space,
  // but since `hero` has no defined height of its own to flex against, that
  // collapses this (and everything inside it) toward zero height instead,
  // clipped by `hero`'s overflow: 'hidden'. Size from content instead.
  heroContent: { marginTop: 6 },
});
