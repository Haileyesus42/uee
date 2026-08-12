import React, { useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/buttons/Button';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { HeartsBadge } from '../../components/progress/Badges';
import { MultipleChoiceOption, OptionState } from '../../components/questions/MultipleChoiceOption';
import { FeedbackBanner } from '../../components/questions/FeedbackBanner';
import { findLesson } from '../../data/curriculum';
import { getLessonContent } from '../../data/lessonContent';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'Lesson'>;

export function LessonScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId, unitId, lessonId } = route.params;
  const lesson = findLesson(subjectId, unitId, lessonId);
  const steps = getLessonContent(lessonId, lesson?.title ?? 'this topic');
  const questionCount = steps.filter((s) => s.type === 'question').length;

  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const firstAttemptResults = useRef<boolean[]>([]);

  if (!lesson) return null;

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isCorrect = step.type === 'question' && selected === step.correctIndex;

  function goToStep(nextIndex: number) {
    setStepIndex(nextIndex);
    setSelected(null);
    setChecked(false);
    setAttempted(false);
    setShowHint(false);
  }

  function handleAdvance() {
    if (isLastStep) {
      const correctCount = firstAttemptResults.current.filter(Boolean).length;
      navigation.replace('LessonComplete', {
        subjectId,
        unitId,
        lessonId,
        xpEarned: questionCount * 10,
        correctCount,
        totalQuestions: questionCount || 1,
      });
      return;
    }
    goToStep(stepIndex + 1);
  }

  function handleCheck() {
    if (step.type !== 'question' || selected === null) return;
    if (!attempted) {
      firstAttemptResults.current.push(selected === step.correctIndex);
      setAttempted(true);
    }
    setChecked(true);
  }

  function handleRetry() {
    setSelected(null);
    setChecked(false);
  }

  function optionState(i: number): OptionState {
    if (step.type !== 'question') return 'default';
    if (!checked) return selected === i ? 'selected' : 'default';
    if (i === step.correctIndex) return 'correct';
    if (i === selected) return 'incorrect';
    return 'default';
  }

  const showFooterButton = step.type !== 'question' || !checked;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <View style={[styles.header, { paddingHorizontal: t.spacing.md }]}>
        <Pressable
          onPress={() => navigation.navigate('SubjectPath', { subjectId })}
          hitSlop={10}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={22} color={t.colors.textSecondary} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <ProgressBar progress={(stepIndex + 1) / steps.length} height={6} />
        </View>
        <HeartsBadge hearts={4} max={5} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {step.type === 'explanation' && (
          <View>
            <View style={[styles.iconChip, { backgroundColor: t.colors.brandLight }]}>
              <Ionicons name="bulb-outline" size={24} color={t.colors.brand} />
            </View>
            <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: 18 }]}>{step.heading}</Text>
            <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 12 }]}>{step.body}</Text>
          </View>
        )}

        {step.type === 'example' && (
          <View>
            <View style={[styles.iconChip, { backgroundColor: t.colors.brandLight }]}>
              <Ionicons name="construct-outline" size={24} color={t.colors.brand} />
            </View>
            <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: 18 }]}>{step.heading}</Text>
            <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 12, marginBottom: 20 }]}>
              {step.body}
            </Text>
            {step.steps.map((line, i) => (
              <View key={i} style={styles.workedRow}>
                <View style={[styles.workedIndex, { backgroundColor: t.colors.brandLight }]}>
                  <Text style={[t.typography.caption, { color: t.colors.brand, fontWeight: '700' }]}>{i + 1}</Text>
                </View>
                <Text style={[t.typography.body, { color: t.colors.textPrimary, marginLeft: 12, flex: 1 }]}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        )}

        {step.type === 'question' && (
          <View>
            <Text style={[t.typography.question, { color: t.colors.textPrimary, marginBottom: 24 }]}>
              {step.prompt}
            </Text>
            {step.options.map((option, i) => (
              <MultipleChoiceOption
                key={option}
                label={option}
                state={optionState(i)}
                onPress={() => !checked && setSelected(i)}
              />
            ))}

            {!checked && (
              <Pressable onPress={() => setShowHint((v) => !v)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.brand }]}>
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </Text>
              </Pressable>
            )}
            {!checked && showHint && (
              <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 8 }]}>
                {step.hint}
              </Text>
            )}

            {checked && isCorrect && (
              <View style={{ marginTop: 12 }}>
                <FeedbackBanner
                  variant="success"
                  title="Correct!"
                  message={step.explanation}
                  primaryLabel="Continue"
                  onPrimaryPress={handleAdvance}
                />
              </View>
            )}
            {checked && !isCorrect && (
              <View style={{ marginTop: 12 }}>
                <FeedbackBanner
                  variant="error"
                  title="Not quite — let's understand what happened."
                  message={step.explanation}
                  primaryLabel="Try Again"
                  onPrimaryPress={handleRetry}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {showFooterButton && (
        <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
          <Button
            label={step.type === 'question' ? 'Check' : 'Continue'}
            onPress={step.type === 'question' ? handleCheck : handleAdvance}
            disabled={step.type === 'question' && selected === null}
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
  iconChip: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  workedRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  workedIndex: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
