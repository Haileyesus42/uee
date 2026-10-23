import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import { PracticeStackParamList } from '../../navigation/types';
import { MathText } from '../../components/common/MathText';

type Props = NativeStackScreenProps<PracticeStackParamList, 'Results'>;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function ResultsScreen({ navigation, route }: Props) {
  const { mode, subjectName, topic, correctCount, totalQuestions, timeSpentSeconds, reviewItems } = route.params;
  const t = useTheme();
  const [showReview, setShowReview] = useState(false);
  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const isMock = mode === 'mock';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingTop: t.spacing.xl, flexGrow: 1 }}>
        <View style={[styles.badge, { backgroundColor: t.colors.brandLight }]}>
          <Ionicons name={accuracy >= 70 ? 'trophy' : 'ribbon'} size={26} color={t.colors.brand} />
        </View>
        <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: 16 }]}>
          {isMock ? 'Exam Submitted' : 'Practice Complete'}
        </Text>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 4 }]}>
          {subjectName} · {topic}
        </Text>

        <View style={{ marginTop: 28 }}>
          <Text style={[t.typography.display, { color: t.colors.brand }]}>{accuracy}%</Text>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>
            {correctCount} of {totalQuestions} correct
          </Text>
        </View>

        {isMock && (
          <View style={{ marginTop: 16 }}>
            <StatRow label="Time spent" value={formatTime(timeSpentSeconds)} />
          </View>
        )}

        <Pressable onPress={() => setShowReview((v) => !v)} style={styles.reviewToggle}>
          <Text style={[t.typography.bodyStrong, { color: t.colors.brand }]}>
            {showReview ? 'Hide Review' : 'Review Answers'}
          </Text>
          <Ionicons name={showReview ? 'chevron-up' : 'chevron-down'} size={16} color={t.colors.brand} />
        </Pressable>

        {showReview && (
          <View style={{ marginTop: 12 }}>
            {reviewItems.map((item, i) => {
              // Correctness is only defined when the source published a key;
              // an unkeyed question is neither right nor wrong.
              const hasKey = item.correctIndex !== null;
              const isRight = hasKey && item.selectedIndex === item.correctIndex;
              return (
                <Card key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Ionicons
                      name={hasKey ? (isRight ? 'checkmark-circle' : 'close-circle') : 'help-circle-outline'}
                      size={16}
                      color={hasKey ? (isRight ? t.colors.success : t.colors.error) : t.colors.textSecondary}
                    />
                    <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 6 }]}>
                      Question {i + 1}
                    </Text>
                  </View>
                  <MathText style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 6 }]}>
                    {item.prompt}
                  </MathText>
                  <View style={styles.answerRow}>
                    <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
                      {hasKey ? 'Correct answer: ' : 'Answer key: '}
                    </Text>
                    <MathText style={[t.typography.caption, { color: t.colors.textSecondary, flex: 1 }]}>
                      {hasKey ? item.options[item.correctIndex as number] : 'not published for this question'}
                    </MathText>
                  </View>
                  {hasKey && !isRight && item.selectedIndex >= 0 && (
                    <View style={styles.answerRow}>
                      <Text style={[t.typography.caption, { color: t.colors.error }]}>Your answer: </Text>
                      <MathText style={[t.typography.caption, { color: t.colors.error, flex: 1 }]}>
                        {item.options[item.selectedIndex]}
                      </MathText>
                    </View>
                  )}
                  <MathText style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 6 }]}>
                    {item.explanation}
                  </MathText>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button label="Done" onPress={() => navigation.popToTop()} />
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
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 24 },
  reviewCard: { marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  answerRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
});
