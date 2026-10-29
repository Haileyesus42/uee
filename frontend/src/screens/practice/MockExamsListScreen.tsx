import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { useSubjects } from '../../hooks/useCurriculum';
import { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'MockExamsList'>;

// Real UEE paper format per subject. Verify against the official exam
// guidelines for the year you're targeting — these are close to recent
// formats (sciences: 50 Q / 2h; English: 60 Q / 1.5h; Aptitude & Civics:
// 50 Q / 1.5h) but the exact numbers have shifted between cohorts.
// The key is per-subject, not one-size-fits-all: the old code used a single
// 20/30 constant for every subject, which made "full-length simulation" a lie.
const EXAM_CONFIG: Record<string, { questionCount: number; timeLimitMinutes: number }> = {
  mathematics: { questionCount: 50, timeLimitMinutes: 120 },
  physics: { questionCount: 50, timeLimitMinutes: 120 },
  chemistry: { questionCount: 50, timeLimitMinutes: 120 },
  biology: { questionCount: 50, timeLimitMinutes: 120 },
  english: { questionCount: 60, timeLimitMinutes: 90 },
  aptitude: { questionCount: 50, timeLimitMinutes: 90 },
  civics: { questionCount: 50, timeLimitMinutes: 90 },
};

const DEFAULT_CONFIG = { questionCount: 50, timeLimitMinutes: 120 };

function configFor(subject: { slug?: string; name: string }) {
  const key = (subject.slug ?? subject.name).toLowerCase();
  return EXAM_CONFIG[key] ?? DEFAULT_CONFIG;
}

export function MockExamsListScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: allSubjects } = useSubjects();
  if (!allSubjects) return null;

  // Only list subjects with enough real questions to fill their configured
  // exam length — some subjects have zero ingested questions and would crash
  // QuizRunner if listed anyway (see backend/src/modules/curriculum/routes.ts).
  const subjects = allSubjects.filter((s) => s.questionCount >= configFor(s).questionCount);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Model Exams" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 20 }]}>
          Full-length, timed simulations. No hints, no XP — just like the real UEE.
        </Text>

        {subjects.map((subject, i) => {
          const config = configFor(subject);
          return (
            <Pressable
              key={subject.id}
              onPress={() =>
                navigation.navigate('QuizRunner', {
                  mode: 'mock',
                  subjectId: subject.id,
                  subjectName: subject.name,
                  topic: 'Full Mock Exam',
                  questionCount: config.questionCount,
                  timeLimitMinutes: config.timeLimitMinutes,
                })
              }
            >
              <Card style={i === subjects.length - 1 ? undefined : styles.cardSpacing}>
                <View style={styles.row}>
                  <View style={[styles.iconChip, { backgroundColor: t.colors.brandLight }]}>
                    <Ionicons name={subject.icon as keyof typeof Ionicons.glyphMap} size={20} color={t.colors.brand} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{subject.name}</Text>
                    <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>
                      {config.questionCount} questions · {config.timeLimitMinutes} min
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconChip: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardSpacing: { marginBottom: 12 },
});