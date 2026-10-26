import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { AppTopBar } from '../../components/navigation/AppTopBar';
import { TopBarActions } from '../../components/navigation/TopBarActions';
import { Card } from '../../components/cards/Card';
import { LearnSummaryCard } from '../../components/learn/LearnSummaryCard';
import { GradeSelector } from '../../components/learn/GradeSelector';
import { CourseCard, CourseTint } from '../../components/learn/CourseCard';
import { TextbookCard } from '../../components/learn/TextbookCard';
import { LearnMode, LearnModeSelector } from '../../components/learn/LearnModeSelector';
import { Grade } from '../../data/curriculum';
import { useAllSubjectUnits, useSubjects, countLessonsForGrade } from '../../hooks/useCurriculum';
import {
  useAllSubjectReadingProgress,
  useAllSubjectTextbookToc,
  summarizeReadingProgress,
} from '../../hooks/useTextbook';
import { LearnStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<LearnStackParamList, 'LearnHome'>,
  BottomTabScreenProps<MainTabParamList>
>;

const TINTS: CourseTint[] = ['brand', 'warning', 'success', 'secondary'];

export function LearnHomeScreen({ navigation }: Props) {
  const t = useTheme();
  const [grade, setGrade] = useState<Grade>(12);
  const [mode, setMode] = useState<LearnMode>('interactive');
  const { data: subjects, isLoading, isError, error, refetch } = useSubjects();
  const unitQueries = useAllSubjectUnits(subjects);
  const textbookSubjectsAll = (subjects ?? []).filter((s) => s.hasTextbook);
  const teacherGuideSubjectsAll = (subjects ?? []).filter((s) => s.hasTeacherGuide);
  const textbookTocQueries = useAllSubjectTextbookToc(textbookSubjectsAll, 'textbook', grade);
  const textbookProgressQueries = useAllSubjectReadingProgress(textbookSubjectsAll, 'textbook');
  const teacherGuideTocQueries = useAllSubjectTextbookToc(teacherGuideSubjectsAll, 'teacher_guide', grade);
  const teacherGuideProgressQueries = useAllSubjectReadingProgress(teacherGuideSubjectsAll, 'teacher_guide');

  // This screen used to just `return null` for both the loading state AND any
  // fetch failure — meaning a real problem (auth, network, backend down)
  // rendered as a blank page with no way to tell what was wrong, reported as
  // "Learn page is empty". Loading now at least shows a spinner; a failure
  // shows the actual error with a retry, instead of silently showing nothing.
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: t.colors.bg }]}>
        <ActivityIndicator color={t.colors.brand} />
      </SafeAreaView>
    );
  }
  if (isError || !subjects) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: t.colors.bg }]}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 }]}>
          {error instanceof Error ? error.message : "Couldn't load your subjects."}
        </Text>
        <Pressable onPress={() => refetch()} style={{ marginTop: 16 }}>
          <Text style={[t.typography.bodyStrong, { color: t.colors.brand }]}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Each mode's summary stats reflect only that mode's own content for the
  // selected grade — Interactive's lesson counts, Textbook/Guides' reading
  // position within their own TOC — rather than all three tabs sharing one
  // set of (Interactive-shaped) numbers regardless of which is active.
  const interactiveLessons = subjects.reduce(
    (acc, _, i) => {
      const { completed, total } = countLessonsForGrade(unitQueries[i]?.data, grade);
      return { completed: acc.completed + completed, total: acc.total + total };
    },
    { completed: 0, total: 0 }
  );
  // Textbook/Teacher Guide modes only count subjects with real ingested
  // content for the selected grade — everything else stays hidden rather
  // than shown with nothing behind it (same "honest, not fake" call as the
  // empty-lessons units elsewhere in Learn). "Sections done" has no
  // completion log server-side (see summarizeReadingProgress), so it's a
  // how-far-through-the-grade's-content proxy, same spirit as lesson counts.
  const textbookSummary = summarizeReadingProgress(textbookSubjectsAll, textbookTocQueries, textbookProgressQueries);
  const teacherGuideSummary = summarizeReadingProgress(
    teacherGuideSubjectsAll,
    teacherGuideTocQueries,
    teacherGuideProgressQueries
  );

  const summary =
    mode === 'interactive'
      ? {
          avgMastery: interactiveLessons.total === 0 ? 0 : interactiveLessons.completed / interactiveLessons.total,
          courseCount: subjects.length,
          secondaryCount: interactiveLessons.completed,
          secondaryLabel: 'lessons done',
          secondaryIcon: 'checkmark-done-outline' as const,
        }
      : mode === 'textbook'
      ? {
          avgMastery:
            textbookSummary.sectionsTotal === 0 ? 0 : textbookSummary.sectionsCompleted / textbookSummary.sectionsTotal,
          courseCount: textbookSummary.subjectsWithContent.length,
          secondaryCount: textbookSummary.sectionsCompleted,
          secondaryLabel: 'sections read',
          secondaryIcon: 'document-text-outline' as const,
        }
      : {
          avgMastery:
            teacherGuideSummary.sectionsTotal === 0
              ? 0
              : teacherGuideSummary.sectionsCompleted / teacherGuideSummary.sectionsTotal,
          courseCount: teacherGuideSummary.subjectsWithContent.length,
          secondaryCount: teacherGuideSummary.sectionsCompleted,
          secondaryLabel: 'sections read',
          secondaryIcon: 'document-text-outline' as const,
        };
  // Textbook/Guides fan out one TOC + one progress request per subject on
  // every grade switch (unlike Interactive, which fetches once and filters
  // client-side — see summarizeReadingProgress) — while those are still in
  // flight, every stat here would otherwise read as a false 0 rather than
  // "still finding out."
  const activeSummaryLoading =
    mode === 'textbook' ? textbookSummary.isLoading : mode === 'teacher_guide' ? teacherGuideSummary.isLoading : false;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <AppTopBar
          title="Learn"
          icon="book-outline"
          right={
            <TopBarActions
              onPressPro={() => navigation.navigate('Profile', { screen: 'Premium' })}
              onPressProfile={() => navigation.navigate('Profile', { screen: 'ProfileHome' })}
            />
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <View style={styles.subtitleRow}>
          <View style={[styles.subtitleIcon, { backgroundColor: t.colors.brandLight }]}>
            <Ionicons name="school-outline" size={16} color={t.colors.brand} />
          </View>
          <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginLeft: 10, flex: 1 }]}>
            Master <Text style={{ color: t.colors.brand }}>{subjects.length}</Text> subjects for your UEE
          </Text>
        </View>

        <View style={{ marginTop: 18 }}>
          {activeSummaryLoading ? (
            <Card style={styles.summaryLoading}>
              <ActivityIndicator color={t.colors.brand} />
            </Card>
          ) : (
            <LearnSummaryCard
              avgMastery={summary.avgMastery}
              courseCount={summary.courseCount}
              lessonsCompleted={summary.secondaryCount}
              secondaryLabel={summary.secondaryLabel}
              secondaryIcon={summary.secondaryIcon}
            />
          )}
        </View>

        <View style={{ marginTop: 18 }}>
          <LearnModeSelector mode={mode} onChange={setMode} />
        </View>

        {mode === 'interactive' ? (
          <>
            <View style={{ marginTop: 18 }}>
              <GradeSelector grade={grade} onChange={setGrade} />
            </View>

            <View style={[styles.grid, { marginTop: 18 }]}>
              {subjects.map((subject, i) => {
                const units = unitQueries[i]?.data;
                const { completed, total } = countLessonsForGrade(units, grade);
                const unit = units?.find((u) => u.grade === grade);
                return (
                  <CourseCard
                    key={subject.id}
                    name={subject.name}
                    icon={subject.icon as keyof typeof Ionicons.glyphMap}
                    unitTitle={unit?.title}
                    mastery={subject.mastery}
                    lessonsCompleted={completed}
                    lessonsTotal={total}
                    tint={TINTS[i % TINTS.length]}
                    onPress={() => navigation.navigate('SubjectPath', { subjectId: subject.id })}
                  />
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={{ marginTop: 18 }}>
              <GradeSelector grade={grade} onChange={setGrade} />
            </View>

            <View style={[styles.grid, { marginTop: 18 }]}>
              {activeSummaryLoading ? (
                <ActivityIndicator color={t.colors.brand} style={{ marginTop: 24, width: '100%' }} />
              ) : (mode === 'textbook' ? textbookSummary : teacherGuideSummary).subjectsWithContent.length === 0 ? (
                <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 8 }]}>
                  {mode === 'textbook'
                    ? 'No textbooks available yet for this grade — check back soon.'
                    : 'No teacher guides available yet for this grade — check back soon.'}
                </Text>
              ) : (
                (mode === 'textbook' ? textbookSummary : teacherGuideSummary).subjectsWithContent.map((subject, i) => (
                  <TextbookCard
                    key={subject.id}
                    name={subject.name}
                    icon={subject.icon as keyof typeof Ionicons.glyphMap}
                    tint={TINTS[i % TINTS.length]}
                    onPress={() => navigation.navigate('TextbookHome', { subjectId: subject.id, grade, kind: mode === 'teacher_guide' ? 'teacher_guide' : 'textbook' })}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center' },
  subtitleIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryLoading: { minHeight: 94, alignItems: 'center', justifyContent: 'center' },
});
