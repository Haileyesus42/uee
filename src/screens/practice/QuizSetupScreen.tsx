import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/buttons/Button';
import { useSubjects } from '../../hooks/useCurriculum';
import { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'QuizSetup'>;

const QUESTION_COUNTS = [5, 10, 15, 20];

export function QuizSetupScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { data: subjects } = useSubjects();
  const [subjectId, setSubjectId] = useState(route.params.presetSubjectId ?? null);
  const [questionCount, setQuestionCount] = useState(10);

  if (!subjects) return null;
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Quiz Setup" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, flexGrow: 1 }}>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary, letterSpacing: 0.5, marginBottom: 12 }]}>
          SUBJECT
        </Text>
        <View style={styles.subjectGrid}>
          {subjects.map((s) => {
            const selected = subject.id === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSubjectId(s.id)}
                style={[
                  styles.subjectChip,
                  {
                    backgroundColor: selected ? t.colors.brandLight : t.colors.surface,
                    borderColor: selected ? t.colors.brand : t.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={s.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={selected ? t.colors.brand : t.colors.textSecondary}
                />
                <Text
                  style={[
                    t.typography.bodyStrong,
                    { color: selected ? t.colors.brand : t.colors.textPrimary, marginLeft: 8, fontSize: 13 },
                  ]}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={15} color={t.colors.brand} style={styles.subjectCheck} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text
          style={[
            t.typography.caption,
            { color: t.colors.textSecondary, letterSpacing: 0.5, marginTop: 20, marginBottom: 12 },
          ]}
        >
          QUESTION COUNT
        </Text>
        <View style={styles.countRow}>
          {QUESTION_COUNTS.map((count) => {
            const selected = count === questionCount;
            return (
              <Pressable
                key={count}
                onPress={() => setQuestionCount(count)}
                style={[
                  styles.countChip,
                  {
                    backgroundColor: selected ? t.colors.brand : t.colors.surface,
                    borderColor: selected ? t.colors.brand : t.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    t.typography.bodyStrong,
                    { color: selected ? t.colors.textInverse : t.colors.textPrimary },
                  ]}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button
          label="Start Practice"
          onPress={() =>
            navigation.navigate('QuizRunner', {
              mode: route.params.mode,
              subjectId: subject.id,
              subjectName: subject.name,
              topic: 'Mixed Practice',
              questionCount,
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subjectChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  subjectCheck: { marginLeft: 'auto' },
  countRow: { flexDirection: 'row', gap: 10 },
  countChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
