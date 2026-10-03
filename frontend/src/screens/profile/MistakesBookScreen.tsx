import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { MultipleChoiceOption } from '../../components/questions/MultipleChoiceOption';
import { useMistakes } from '../../hooks/useProfile';
import { ProfileStackParamList } from '../../navigation/types';
import { MathText } from '../../components/common/MathText';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MistakesBook'>;

export function MistakesBookScreen({ navigation }: Props) {
  const t = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { data: mistakes } = useMistakes();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Mistakes Book" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 20 }]}>
          Questions you've gotten wrong recently. Retry them to build mastery.
        </Text>

        {mistakes?.length === 0 && (
          <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center', marginTop: 20 }]}>
            No mistakes yet — keep practicing!
          </Text>
        )}

        {mistakes?.map((item, i) => {
          const open = openIndex === i;
          return (
            <Pressable key={i} onPress={() => setOpenIndex(open ? null : i)}>
              <Card style={styles.card}>
                <View style={styles.header}>
                  <View style={[styles.iconChip, { backgroundColor: t.colors.errorLight }]}>
                    <Ionicons name="alert-circle-outline" size={16} color={t.colors.error} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{item.subject}</Text>
                    <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 2 }]} numberOfLines={open ? undefined : 2}>
                      {item.question.prompt}
                    </Text>
                  </View>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.colors.textSecondary} />
                </View>

                {open && (
                  <View style={{ marginTop: 12 }}>
                    {item.question.options.map((option, oi) => (
                      <MultipleChoiceOption
                        key={option}
                        label={option}
                        state={oi === item.question.correctIndex ? 'correct' : 'default'}
                      />
                    ))}
                    <MathText style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 4 }]}>
                      {item.question.explanation}
                    </MathText>
                  </View>
                )}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  iconChip: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
