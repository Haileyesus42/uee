import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { MultipleChoiceOption, OptionState } from '../../components/questions/MultipleChoiceOption';
import { RobotHead } from '../../components/home/RobotHead';
import { useUnityChat } from '../../context/UnityChatContext';
import { useUeeQuestions } from '../../hooks/useUee';
import { UeeStackParamList } from '../../navigation/types';
import { MathText } from '../../components/common/MathText';

type Props = NativeStackScreenProps<UeeStackParamList, 'SolutionDetail'>;

// Session-scoped store so answers survive the screen unmounting (backing out
// to the paper list and returning to the same paper). Keyed by paper, so a
// different paper starts fresh. Cleared on app restart.
const sessionAnswers = new Map<string, Record<number, number>>();

function paperKey(stream: string, year: number, subjectId: string) {
  return `${stream}|${year}|${subjectId}`;
}

export function SolutionDetailScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { askUnity } = useUnityChat();
  const { stream, year, subjectId, subjectName, questionIndex } = route.params;
  const { data: questions } = useUeeQuestions(stream, year, subjectId);

  const key = paperKey(stream, year, subjectId);
  const [answers, setAnswers] = useState<Record<number, number>>(
    () => sessionAnswers.get(key) ?? {},
  );

  if (!questions) return null;
  const question = questions[questionIndex];

  // Derive current answer from the map — no reset-on-navigation needed.
  const selected = answers[questionIndex] ?? null;

  const isFirst = questionIndex === 0;
  const isLast = questionIndex === questions.length - 1;
  const hasKey = question.correctIndex !== null;
  const revealed = selected !== null;
  const isCorrect = revealed && hasKey && selected === question.correctIndex;
  const hasAnyAnswers = Object.keys(answers).length > 0;

  function goTo(index: number) {
    navigation.setParams({ questionIndex: index });
  }

  function selectAnswer(i: number) {
    if (answers[questionIndex] !== undefined) return;
    const next = { ...answers, [questionIndex]: i };
    sessionAnswers.set(key, next);
    setAnswers(next);
  }

  // Clears this question's answer so the user can retry. Every other
  // question's answer stays intact.
  function resetCurrentAnswer() {
    const next = { ...answers };
    delete next[questionIndex];
    sessionAnswers.set(key, next);
    setAnswers(next);
  }

  // Clears every answer in this paper after a confirmation. Jumps back to Q1
  // so the user immediately sees the fresh state.
  function resetAllAnswers() {
    Alert.alert(
      'Reset all answers?',
      'This will clear every answer in this paper. You can answer questions again from scratch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            sessionAnswers.set(key, {});
            setAnswers({});
            goTo(0);
          },
        },
      ],
    );
  }

  // Opens the Unity panel and auto-sends a context-rich prompt so the user
  // doesn't have to retype the question. The panel reuses its normal send
  // path (same mutation, same pending bubble, same error handling).
  function askUnityWithContext() {
    const letter = (i: number) => String.fromCharCode(65 + i);
    const optionsList = question.options.map((opt, i) => `${letter(i)}. ${opt}`).join('\n');
    const correctLine =
      question.correctIndex != null
        ? `Correct answer: ${letter(question.correctIndex)}. ${question.options[question.correctIndex]}\n\n`
        : 'Correct answer: not published for this question.\n\n';
    const explanationBlock = question.explanation
      ? `Existing explanation: ${question.explanation}\n\n`
      : '';

    askUnity(
      `I'm studying this UEE question and want a deeper explanation.\n\n` +
        `Question: ${question.prompt}\n\n` +
        `Options:\n${optionsList}\n\n` +
        correctLine +
        explanationBlock +
        `Please explain why the correct answer is right, and why each of the other options is incorrect. ` +
        `Walk me through the reasoning step by step.`
    );
  }

  function optionState(i: number): OptionState {
    if (!revealed) return 'default';
    if (hasKey) {
      if (i === question.correctIndex) return 'correct';
      if (i === selected) return 'incorrect';
      return 'default';
    }
    // No answer key — can't call it wrong, so show the pick as selected.
    return i === selected ? 'selected' : 'default';
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title={`Question ${questionIndex + 1} of ${questions.length}`} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md }}>
        <Text style={[t.typography.caption, { color: t.colors.brand, letterSpacing: 0.5 }]}>
          {subjectName.toUpperCase()} · {year}
        </Text>
        <MathText
          style={[
            t.typography.question,
            { color: t.colors.textPrimary, marginTop: 8, marginBottom: 20, fontSize: 15, lineHeight: 20 },
          ]}
        >
          {question.prompt}
        </MathText>

        {question.options.map((option, i) => (
          <MultipleChoiceOption
            key={option}
            label={option}
            state={optionState(i)}
            onPress={revealed ? undefined : () => selectAnswer(i)}
          />
        ))}

        {revealed && (
          <View style={[styles.explanationCard, { backgroundColor: t.colors.brandLight }]}>
            <View style={styles.explanationHeader}>
              <Ionicons
                name={!hasKey ? 'information-circle' : isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={!hasKey ? t.colors.brand : isCorrect ? t.colors.success : t.colors.error}
              />
              <Text
                style={[
                  t.typography.bodyStrong,
                  {
                    color: !hasKey ? t.colors.brand : isCorrect ? t.colors.success : t.colors.error,
                    marginLeft: 6,
                    flex: 1,
                  },
                ]}
              >
                {!hasKey ? 'No answer key' : isCorrect ? 'Correct!' : 'Not quite'}
              </Text>
              <Pressable
                onPress={askUnityWithContext}
                hitSlop={6}
                style={[styles.askButton, { backgroundColor: t.colors.surface }]}
              >
                <RobotHead size={16} />
                <Text style={[t.typography.caption, { color: t.colors.brand, marginLeft: 4, fontSize: 11 }]}>
                  Ask Unity
                </Text>
              </Pressable>
            </View>
            <MathText style={[t.typography.body, { color: t.colors.textPrimary, marginTop: 6 }]}>
              {question.explanation}
            </MathText>

            <Pressable onPress={resetCurrentAnswer} hitSlop={6} style={styles.tryAgain}>
              <Ionicons name="refresh" size={13} color={t.colors.brand} />
              <Text style={[t.typography.caption, { color: t.colors.brand, marginLeft: 4, fontSize: 12 }]}>
                Try again
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={[styles.navRow, { paddingHorizontal: t.spacing.md }]}>
        <Pressable
          onPress={() => goTo(questionIndex - 1)}
          disabled={isFirst}
          style={[styles.navButton, { borderColor: t.colors.border, opacity: isFirst ? 0.4 : 1 }]}
        >
          <Ionicons name="chevron-back" size={18} color={t.colors.textPrimary} />
          <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginLeft: 4 }]}>Previous</Text>
        </Pressable>
        <Pressable
          onPress={() => goTo(questionIndex + 1)}
          disabled={isLast}
          style={[styles.navButton, { backgroundColor: t.colors.brand, opacity: isLast ? 0.4 : 1 }]}
        >
          <Text style={[t.typography.bodyStrong, { color: t.colors.textInverse, marginRight: 4 }]}>Next</Text>
          <Ionicons name="chevron-forward" size={18} color={t.colors.textInverse} />
        </Pressable>
      </View>

      {hasAnyAnswers && (
        <Pressable onPress={resetAllAnswers} hitSlop={6} style={styles.resetAll}>
          <Ionicons name="refresh-outline" size={12} color={t.colors.textSecondary} />
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 4, fontSize: 11 }]}>
            Reset all answers
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  explanationCard: { borderRadius: 12, padding: 14, marginTop: 8 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center' },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  tryAgain: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, gap: 10 },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
  },
  resetAll: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 12,
  },
});