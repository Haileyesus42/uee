import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/buttons/Button';
import { JourneyRow } from '../../components/progress/JourneyRow';
import { findUnit } from '../../data/curriculum';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'TopicDetail'>;

export function TopicDetailScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId, unitId } = route.params;
  const unit = findUnit(subjectId, unitId);
  if (!unit) return null;

  const nextLesson = unit.lessons.find((l) => l.status === 'current' || l.status === 'available') ?? unit.lessons[0];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, flexGrow: 1 }}>
        <Text style={[t.typography.h1, { color: t.colors.textPrimary }]}>{unit.title}</Text>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 8 }]}>{unit.description}</Text>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 12 }]}>
          {unit.lessons.length} lessons
        </Text>

        <View style={{ marginTop: 28 }}>
          {unit.lessons.map((lesson, i) => (
            <JourneyRow
              key={lesson.id}
              item={{ label: lesson.title, status: lesson.status }}
              isLast={i === unit.lessons.length - 1}
              onPress={() =>
                navigation.navigate('LessonIntroduction', { subjectId, unitId, lessonId: lesson.id })
              }
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button
          label="Continue"
          onPress={() =>
            navigation.navigate('LessonIntroduction', { subjectId, unitId, lessonId: nextLesson.id })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
