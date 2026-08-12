import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { Button } from '../../components/buttons/Button';
import { MultipleChoiceOption, OptionState } from '../../components/questions/MultipleChoiceOption';
import { FeedbackBanner } from '../../components/questions/FeedbackBanner';
import { getPracticeQuestions } from '../../data/practiceQuestions';
import { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'QuizRunner'>;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function QuizRunnerScreen({ navigation, route }: Props) {
  const { mode, subjectId, subjectName, topic, questionCount, timeLimitMinutes } = route.params;
  const t = useTheme();
  const isMock = mode === 'mock';

  const questions = useMemo(() => getPracticeQuestions(subjectId, questionCount), [subjectId, questionCount]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const answers = useRef<number[]>([]);
  const startedAt = useRef(Date.now());

  const totalSeconds = (timeLimitMinutes ?? questionCount * 1.5) * 60;
  const [remaining, setRemaining] = useState(Math.round(totalSeconds));

  useEffect(() => {
    if (!isMock) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          finish();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  function optionState(i: number): OptionState {
    if (!isMock) {
      if (!checked) return selected === i ? 'selected' : 'default';
      if (i === question.correctIndex) return 'correct';
      if (i === selected) return 'incorrect';
      return 'default';
    }
    return selected === i ? 'selected' : 'default';
  }

  function recordAndAdvance() {
    answers.current[index] = selected ?? -1;
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  }

  function finish() {
    const finalAnswers = [...answers.current];
    finalAnswers[index] = finalAnswers[index] ?? (selected ?? -1);
    const reviewItems = questions.map((q, i) => ({
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex: finalAnswers[i] ?? -1,
      explanation: q.explanation,
    }));
    const correctCount = reviewItems.filter((r) => r.selectedIndex === r.correctIndex).length;
    const timeSpentSeconds = Math.round((Date.now() - startedAt.current) / 1000);

    navigation.replace('Results', {
      mode,
      subjectName,
      topic,
      correctCount,
      totalQuestions: questions.length,
      timeSpentSeconds,
      reviewItems,
    });
  }

  function handlePrimary() {
    if (!isMock && !checked) {
      setChecked(true);
      return;
    }
    recordAndAdvance();
  }

  const isCorrect = !isMock && selected === question.correctIndex;
  const showFooterButton = isMock || !checked;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <View style={[styles.header, { paddingHorizontal: t.spacing.md }]}>
        <Pressable onPress={() => navigation.popToTop()} hitSlop={10} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={t.colors.textSecondary} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <ProgressBar progress={(index + 1) / questions.length} height={6} />
        </View>
        {isMock ? (
          <Text style={[t.typography.bodyStrong, { color: remaining < 60 ? t.colors.error : t.colors.textPrimary }]}>
            {formatTime(remaining)}
          </Text>
        ) : (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
            {index + 1}/{questions.length}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Text style={[t.typography.caption, { color: t.colors.brand, letterSpacing: 0.5, marginTop: 8 }]}>
          {subjectName.toUpperCase()}
        </Text>
        <Text style={[t.typography.question, { color: t.colors.textPrimary, marginTop: 8, marginBottom: 24 }]}>
          {question.prompt}
        </Text>

        {question.options.map((option, i) => (
          <MultipleChoiceOption
            key={option}
            label={option}
            state={optionState(i)}
            onPress={() => !(!isMock && checked) && setSelected(i)}
          />
        ))}

        {!isMock && checked && (
          <View style={{ marginTop: 12 }}>
            <FeedbackBanner
              variant={isCorrect ? 'success' : 'error'}
              title={isCorrect ? 'Correct!' : "Not quite — let's understand what happened."}
              message={question.explanation}
              primaryLabel={isLast ? 'See Results' : 'Continue'}
              onPrimaryPress={recordAndAdvance}
            />
          </View>
        )}
      </ScrollView>

      {showFooterButton && (
        <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
          <Button
            label={isMock ? (isLast ? 'Submit Exam' : 'Next') : 'Check'}
            onPress={handlePrimary}
            disabled={selected === null}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  closeButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
