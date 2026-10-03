import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar } from '../../components/common/Avatar';
import { ProBadgeButton } from '../../components/navigation/ProBadgeButton';
import { ExamCountdownHero } from '../../components/home/ExamCountdownHero';
import { StreakWeekBar } from '../../components/home/StreakWeekBar';
import { ContinueLearningCard } from '../../components/home/ContinueLearningCard';
import { TrustBanner } from '../../components/home/TrustBanner';
import { FeatureGrid, FeatureId } from '../../components/home/FeatureGrid';
import { TodaysGoalCard } from '../../components/home/TodaysGoalCard';
import { SmartInsightCard } from '../../components/home/SmartInsightCard';
import { useMe } from '../../hooks/useProfile';
import { useAllSubjectUnits, useSubjects } from '../../hooks/useCurriculum';
import { HomeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeDashboard'>,
  BottomTabScreenProps<MainTabParamList>
>;

// The next lesson to resume is the first "current" lesson found across subjects, in
// subject-list order — every subject has at most one (see the linear-unlock logic in
// backend/src/modules/curriculum/routes.ts), so this picks the first one going.
function useContinueLearning() {
  const { data: subjects } = useSubjects();
  const unitQueries = useAllSubjectUnits(subjects);

  for (let i = 0; i < (subjects?.length ?? 0); i++) {
    const subject = subjects![i];
    const units = unitQueries[i]?.data;
    if (!units) continue;
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
        progress: lessonIndex / unit.lessons.length,
      };
    }
  }
  return null;
}

export function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMe();
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
      ? ['#5636d6', '#6c48e0', '#5a4a8f', '#241c42', t.colors.bg]
      : ['#5636d6', '#6c48e0', '#8f76ea', '#ece8fa', '#f6f4fc'];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={[]}>
      <LinearGradient
        colors={heroColors}
        locations={[0, 0.14, 0.3, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.4 }}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Ionicons name="compass" size={20} color="#FFFFFF" />
            <Text style={styles.brandText}>Compass</Text>
          </View>
          <View style={styles.topBarRight}>
            <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.topBarButton}>
              <Ionicons name="notifications-outline" size={16} color="#5636d6" />
            </Pressable>
            <ProBadgeButton onPress={() => navigation.navigate('Profile', { screen: 'Premium' })} />
            <Pressable onPress={() => navigation.navigate('Profile', { screen: 'ProfileHome' })}>
              <Avatar
                userId={profile?.id ?? ''}
                hasPhoto={profile?.hasAvatarPhoto ?? false}
                emoji={profile?.avatarEmoji ?? '🧑🎓'}
                size={40}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroContent}>
          <ExamCountdownHero daysUntilExam={62} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl, gap: 12 }}>
        <StreakWeekBar streakDays={profile?.streakDays ?? 0} />
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
        <TrustBanner />
        <FeatureGrid onPressItem={handleFeaturePress} />
        <TodaysGoalCard
          minutesDone={12}
          minutesGoal={15}
          daysCompleted={4}
          xpEarned={profile?.xp ?? 0}
          level={profile?.level ?? 1}
          levelTitle={profile?.levelTitle ?? 'New Learner'}
        />
        {weakestSubject && (
          <SmartInsightCard
            message={
              weakestSubject.mastery > 0
                ? `${weakestSubject.name} is your weakest subject at ${Math.round(weakestSubject.mastery * 100)}% mastery.`
                : `You haven't started ${weakestSubject.name} yet — a great place to build momentum.`
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
    paddingBottom: 12,
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
  topBarButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { marginTop: 10 },
});
