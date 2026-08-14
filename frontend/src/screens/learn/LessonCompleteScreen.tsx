import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/buttons/Button';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { XpPill } from '../../components/progress/Badges';
import { useSubjects, useUnits } from '../../hooks/useCurriculum';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'LessonComplete'>;

export function LessonCompleteScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId, unitId, lessonId, xpEarned, correctCount, totalQuestions } = route.params;
  const { data: units } = useUnits(subjectId);
  const { data: subjects } = useSubjects();
  const unit = units?.find((u) => u.id === unitId);
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  // Mastery just refetched post-completion (LessonScreen invalidates the subjects
  // query on submit) — "before" is an approximation, not a stored history value.
  const masteryAfter = subjects?.find((s) => s.id === subjectId)?.mastery ?? 0;
  const masteryBefore = Math.max(0, masteryAfter - 0.06);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingTop: t.spacing.xl, flexGrow: 1 }}>
        <View style={[styles.badge, { backgroundColor: t.colors.brandLight }]}>
          <Ionicons name="trophy" size={26} color={t.colors.brand} />
        </View>
        <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: 16 }]}>Lesson Complete</Text>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 4 }]}>
          Nice work — here's how you did.
        </Text>

        <View style={{ marginTop: 20 }}>
          <XpPill xp={xpEarned} />
        </View>

        <View style={{ marginTop: 28 }}>
          <StatRow label="Accuracy" value={`${accuracy}%`} />
          <StatRow label="Questions answered" value={`${totalQuestions}`} />
        </View>

        {unit ? (
          <View style={{ marginTop: 28 }}>
            <View style={styles.masteryHeader}>
              <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{unit.title} mastery</Text>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
                {Math.round(masteryBefore * 100)}% → {Math.round(masteryAfter * 100)}%
              </Text>
            </View>
            <ProgressBar progress={masteryAfter} height={6} />
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button
          label="Continue"
          onPress={() =>
            // A plain navigate('SubjectPath', ...) here is ambiguous: when this lesson
            // was reached via Home's "Continue Learning" shortcut (not by drilling down
            // through SubjectPath), SubjectPath isn't already in the stack, so navigate
            // would *push* a new one instead of popping back to an existing one — the
            // resulting stack (…, LessonComplete, SubjectPath) means the back button
            // lands on the just-finished lesson instead of the Learn tab, which is
            // exactly the "loops between lessons" bug. reset() defines the stack
            // explicitly so this is correct regardless of how the lesson was entered.
            navigation.reset({
              index: 1,
              routes: [{ name: 'LearnHome' }, { name: 'SubjectPath', params: { subjectId } }],
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={styles.statRow}>
      <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>{label}</Text>
      <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  masteryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
});
