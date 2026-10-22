import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { useSubjects } from '../../hooks/useCurriculum';
import { useTextbookToc, useReadingProgress } from '../../hooks/useTextbook';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'TextbookHome'>;

export function TextbookHomeScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId, grade, kind = 'textbook' } = route.params;
  const bookLabel = kind === 'teacher_guide' ? 'teacher guide' : 'textbook';
  const { data: subjects } = useSubjects();
  const { data: toc } = useTextbookToc(subjectId, kind, grade);
  const { data: progress } = useReadingProgress(subjectId, kind);
  const subject = subjects?.find((s) => s.id === subjectId);

  if (!subject || !toc) return null;

  if (toc.length === 0) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
        <View style={{ paddingHorizontal: t.spacing.md }}>
          <TopBar title={subject.name} onBack={() => navigation.goBack()} />
        </View>
        <View style={{ padding: t.spacing.md, alignItems: 'center' }}>
          <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 24, textAlign: 'center' }]}>
            No {subject.name} {bookLabel} for Grade {grade} yet — try a different grade.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const continueSection = progress
    ? toc.flatMap((u) => u.sections).find((s) => s.id === progress.sectionId)
    : undefined;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar
          title={subject.name}
          onBack={() => navigation.goBack()}
          action={
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => navigation.navigate('TextbookSearch', { subjectId, kind })} hitSlop={8}>
                <Ionicons name="search-outline" size={20} color={t.colors.textPrimary} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('TextbookBookmarks', { subjectId })} hitSlop={8}>
                <Ionicons name="bookmark-outline" size={20} color={t.colors.textPrimary} />
              </Pressable>
            </View>
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        {continueSection ? (
          <Pressable
            onPress={() => navigation.navigate('TextbookReader', { subjectId, sectionId: continueSection.id, kind })}
          >
            <Card style={[styles.continueCard, { backgroundColor: t.colors.brandLight }]}>
              <Text style={[t.typography.caption, { color: t.colors.brand }]}>Continue Reading</Text>
              <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 2 }]}>
                {continueSection.sectionTitle}
              </Text>
            </Card>
          </Pressable>
        ) : null}

        {toc.map((unit) => (
          <View key={unit.unitTitle} style={{ marginTop: 20 }}>
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginBottom: 8 }]}>
              {unit.unitTitle}
            </Text>
            <Card padded={false}>
              {unit.sections.map((section, i) => (
                <Pressable
                  key={section.id}
                  onPress={() => navigation.navigate('TextbookReader', { subjectId, sectionId: section.id, kind })}
                >
                  <View
                    style={[
                      styles.sectionRow,
                      {
                        borderBottomColor: t.colors.border,
                        borderBottomWidth: i === unit.sections.length - 1 ? 0 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Text style={[t.typography.body, { color: t.colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                      {section.sectionTitle}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={t.colors.textSecondary} />
                  </View>
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  continueCard: { marginBottom: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
});
