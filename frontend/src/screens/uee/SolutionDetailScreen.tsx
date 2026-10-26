import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { MultipleChoiceOption } from '../../components/questions/MultipleChoiceOption';
import { RobotHead } from '../../components/home/RobotHead';
import { useUnityChat } from '../../context/UnityChatContext';
import { useUeeQuestions } from '../../hooks/useUee';
import { UeeStackParamList } from '../../navigation/types';
import { MathText } from '../../components/common/MathText';

type Props = NativeStackScreenProps<UeeStackParamList, 'SolutionDetail'>;

export function SolutionDetailScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { openChat } = useUnityChat();
  const { stream, year, subjectId, subjectName, questionIndex } = route.params;
  const { data: questions } = useUeeQuestions(stream, year, subjectId);
  if (!questions) return null;
  const question = questions[questionIndex];

  const isFirst = questionIndex === 0;
  const isLast = questionIndex === questions.length - 1;

  function goTo(index: number) {
    navigation.setParams({ questionIndex: index });
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title={`Question ${questionIndex + 1} of ${questions.length}`} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, flexGrow: 1 }}>
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
            state={i === question.correctIndex ? 'correct' : 'default'}
          />
        ))}

        <View style={[styles.explanationCard, { backgroundColor: t.colors.brandLight }]}>
          <View style={styles.explanationHeader}>
            <Ionicons name="bulb" size={16} color={t.colors.brand} />
            <Text style={[t.typography.bodyStrong, { color: t.colors.brand, marginLeft: 6, flex: 1 }]}>
              Explanation
            </Text>
            <Pressable
              onPress={openChat}
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
        </View>
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
});
