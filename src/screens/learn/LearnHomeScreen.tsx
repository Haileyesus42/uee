import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { AppTopBar } from '../../components/navigation/AppTopBar';
import { TopBarActions } from '../../components/navigation/TopBarActions';
import { LearnSummaryCard } from '../../components/learn/LearnSummaryCard';
import { GradeSelector } from '../../components/learn/GradeSelector';
import { CourseCard, CourseTint } from '../../components/learn/CourseCard';
import { Grade } from '../../data/curriculum';
import { useAllSubjectUnits, useSubjects, countLessons, countLessonsForGrade } from '../../hooks/useCurriculum';
import { LearnStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<LearnStackParamList, 'LearnHome'>,
  BottomTabScreenProps<MainTabParamList>
>;

const TINTS: CourseTint[] = ['brand', 'warning', 'success', 'secondary'];

export function LearnHomeScreen({ navigation }: Props) {
  const t = useTheme();
  const [grade, setGrade] = useState<Grade>(12);
  const { data: subjects } = useSubjects();
  const unitQueries = useAllSubjectUnits(subjects);

  if (!subjects) return null;

  const avgMastery = subjects.length ? subjects.reduce((sum, s) => sum + s.mastery, 0) / subjects.length : 0;
  const totalLessonsCompleted = unitQueries.reduce((sum, q) => sum + countLessons(q.data).completed, 0);

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
          <LearnSummaryCard
            avgMastery={avgMastery}
            courseCount={subjects.length}
            lessonsCompleted={totalLessonsCompleted}
          />
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center' },
  subtitleIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
