import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import { PaperModeSelector, PaperMode } from '../../components/uee/PaperModeSelector';
import { getPaperQuestions } from '../../data/pastPapers';
import { UeeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<UeeStackParamList, 'PaperViewer'>,
  BottomTabScreenProps<MainTabParamList>
>;

const MINUTES_PER_QUESTION = 1.5;
const EXAM_RULES = [
  'The timer starts immediately and runs continuously',
  'No hints or explanations while the exam is in progress',
  'The exam auto-submits when time runs out',
  "You'll see full solutions and your score at the end",
];

export function PaperViewerScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { year, subjectId, subjectName } = route.params;
  const questions = getPaperQuestions(subjectId, year);
  const [mode, setMode] = useState<PaperMode>('study');
  const examMinutes = Math.round(questions.length * MINUTES_PER_QUESTION);

  function startExam() {
    Alert.alert(
      'Start Exam Mode?',
      `You'll have ${examMinutes} minutes for ${questions.length} questions. Once started, the timer can't be paused.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () =>
            navigation.navigate('Practice', {
              screen: 'QuizRunner',
              params: {
                mode: 'mock',
                subjectId,
                subjectName,
                topic: `${year} UEE Exam`,
                questionCount: questions.length,
                timeLimitMinutes: examMinutes,
              },
            }),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title={`${subjectName} ${year}`} onBack={() => navigation.goBack()} />
      </View>

      <View style={{ paddingHorizontal: t.spacing.md, marginTop: 8 }}>
        <PaperModeSelector mode={mode} onChange={setMode} />
      </View>

      {mode === 'study' ? (
        <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginBottom: 16 }]}>
            {questions.length} questions · Tap a question to view its solution
          </Text>

          {questions.map((q, i) => (
            <Pressable
              key={i}
              onPress={() => navigation.navigate('SolutionDetail', { year, subjectId, subjectName, questionIndex: i })}
              style={[styles.row, { borderBottomColor: t.colors.border }]}
            >
              <Text style={[t.typography.bodyStrong, { color: t.colors.brand }]}>{i + 1}</Text>
              <Text style={[t.typography.body, { color: t.colors.textPrimary, flex: 1, marginLeft: 12 }]} numberOfLines={2}>
                {q.prompt}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: t.spacing.md }}>
          <Card>
            <View style={[styles.examIconChip, { backgroundColor: t.colors.brandLight }]}>
              <Ionicons name="timer-outline" size={24} color={t.colors.brand} />
            </View>
            <Text style={[t.typography.h2, { color: t.colors.textPrimary, marginTop: 12 }]}>Exam Mode</Text>
            <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 4 }]}>
              A realistic, timed simulation — as close to the real UEE as it gets.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={[t.typography.h2, { color: t.colors.textPrimary }]}>{questions.length}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>Questions</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
              <View style={styles.statCol}>
                <Text style={[t.typography.h2, { color: t.colors.textPrimary }]}>{examMinutes}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>Minutes</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: t.colors.border }]} />

            {EXAM_RULES.map((rule) => (
              <View key={rule} style={styles.ruleRow}>
                <Ionicons name="ellipse" size={5} color={t.colors.textSecondary} style={{ marginTop: 7 }} />
                <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8, flex: 1 }]}>
                  {rule}
                </Text>
              </View>
            ))}

            <View style={{ marginTop: 16 }}>
              <Button label="Start Exam" onPress={startExam} />
            </View>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  examIconChip: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, gap: 24 },
  statCol: { alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  ruleRow: { flexDirection: 'row', marginBottom: 8 },
});
