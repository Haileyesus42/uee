import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { UnitPath } from '../../components/learn/UnitPath';
import { useSubjects, useUnits } from '../../hooks/useCurriculum';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'SubjectPath'>;

export function SubjectPathScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId } = route.params;
  const { data: subjects } = useSubjects();
  const { data: units } = useUnits(subjectId);
  const subject = subjects?.find((s) => s.id === subjectId);
  if (!subject || !units) return null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title={subject.name} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <View style={styles.masteryRow}>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>Overall mastery</Text>
          <Text style={[t.typography.caption, { color: t.colors.textPrimary }]}>
            {Math.round(subject.mastery * 100)}%
          </Text>
        </View>
        <ProgressBar progress={subject.mastery} height={5} />

        <View style={{ marginTop: 32 }}>
          {units.map((unit, i) => (
            <View key={unit.id} style={{ marginBottom: i === units.length - 1 ? 0 : 36 }}>
              <UnitPath
                title={unit.title}
                grade={unit.grade as 9 | 10 | 11 | 12}
                lessons={unit.lessons.map((l) => ({ label: l.title, status: l.status }))}
                onPressHeader={() => navigation.navigate('TopicDetail', { subjectId: subject.id, unitId: unit.id })}
                onPressLesson={(index) =>
                  navigation.navigate('LessonIntroduction', {
                    subjectId: subject.id,
                    unitId: unit.id,
                    lessonId: unit.lessons[index].id,
                  })
                }
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  masteryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
});
