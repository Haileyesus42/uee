import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { Button } from '../../components/buttons/Button';
import { MultipleChoiceOption, OptionState } from '../../components/questions/MultipleChoiceOption';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DiagnosticQuestion'>;

type Question = { subject: string; prompt: string; options: string[]; correctIndex: number };

const QUESTIONS: Question[] = [
  {
    subject: 'Mathematics',
    prompt: 'Solve for x: 2x + 6 = 14',
    options: ['x = 2', 'x = 4', 'x = 6', 'x = 10'],
    correctIndex: 1,
  },
  {
    subject: 'Physics',
    prompt: 'What is the SI unit of force?',
    options: ['Joule', 'Watt', 'Newton', 'Pascal'],
    correctIndex: 2,
  },
  {
    subject: 'English',
    prompt: "Choose the correctly punctuated sentence.",
    options: [
      "Its a beautiful day, isn't it?",
      "It's a beautiful day, isn't it?",
      "Its' a beautiful day, isnt it?",
      "It is a beautiful day isnt it",
    ],
    correctIndex: 1,
  },
];

export function DiagnosticQuestionScreen({ navigation }: Props) {
  const t = useTheme();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;

  function optionState(i: number): OptionState {
    if (!checked) return selected === i ? 'selected' : 'default';
    if (i === question.correctIndex) return 'correct';
    if (i === selected) return 'incorrect';
    return 'default';
  }

  function handlePrimary() {
    if (!checked) {
      setChecked(true);
      return;
    }
    if (isLast) {
      navigation.navigate('DiagnosticResults');
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar onBack={() => navigation.goBack()} />
        <View style={{ marginTop: 4 }}>
          <ProgressBar progress={(index + (checked ? 1 : 0)) / QUESTIONS.length} height={5} />
        </View>
      </View>

      <View style={[styles.content, { paddingHorizontal: t.spacing.md }]}>
        <Text style={[t.typography.caption, { color: t.colors.brand, letterSpacing: 0.5, marginTop: 20 }]}>
          {question.subject.toUpperCase()}
        </Text>
        <Text style={[t.typography.question, { color: t.colors.textPrimary, marginTop: 8, marginBottom: 24 }]}>
          {question.prompt}
        </Text>

        {question.options.map((option, i) => (
          <MultipleChoiceOption
            key={option}
            label={option}
            state={optionState(i)}
            onPress={() => !checked && setSelected(i)}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button
          label={checked ? (isLast ? 'See My Results' : 'Continue') : 'Check'}
          onPress={handlePrimary}
          disabled={selected === null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1 },
});
