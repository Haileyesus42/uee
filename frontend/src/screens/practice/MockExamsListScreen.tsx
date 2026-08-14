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

const QUESTION_COUNT = 20;
const TIME_LIMIT_MINUTES = 30;

export function MockExamsListScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: subjects } = useSubjects();
  if (!subjects) return null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Mock Exams" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 20 }]}>
          Full-length, timed simulations. No hints, no XP — just like the real UEE.
        </Text>

        {subjects.map((subject, i) => (
          <Pressable
            key={subject.id}
            onPress={() =>
              navigation.navigate('QuizRunner', {
                mode: 'mock',
                subjectId: subject.id,
                subjectName: subject.name,
                topic: 'Full Mock Exam',
                questionCount: QUESTION_COUNT,
                timeLimitMinutes: TIME_LIMIT_MINUTES,
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
                    {QUESTION_COUNT} questions · {TIME_LIMIT_MINUTES} min
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
              </View>
            </Card>
          </Pressable>
        ))}
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
