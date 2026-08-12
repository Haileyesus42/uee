import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { useTheme } from '../../theme/ThemeProvider';
import { useUnits, useLesson } from '../../hooks/useCurriculum';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'LessonIntroduction'>;

export function LessonIntroductionScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId, unitId, lessonId } = route.params;
  const { data: units } = useUnits(subjectId);
  const unit = units?.find((u) => u.id === unitId);
  const { data: lesson } = useLesson(lessonId);
  if (!unit || !lesson) return null;

  const questionCount = lesson.steps.filter((s) => s.type === 'question').length;

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      icon="bulb-outline"
      eyebrow={unit.title.toUpperCase()}
      title={lesson.title}
      subtitle={`A short, interactive lesson covering ${lesson.title.toLowerCase()}.`}
      primaryLabel="Start Lesson"
      onPrimaryPress={() => navigation.navigate('Lesson', { subjectId, unitId, lessonId })}
    >
      <View style={styles.metaRow}>
        <MetaItem label="Steps" value={String(lesson.steps.length)} />
        <MetaItem label="Questions" value={String(questionCount)} />
        <MetaItem label="XP" value={`+${questionCount * 10}`} />
      </View>
    </OnboardingLayout>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ marginRight: 28 }}>
      <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{value}</Text>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row' },
});
