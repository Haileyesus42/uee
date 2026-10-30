import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { useUeeSubjects } from '../../hooks/useUee';
import { UeeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<UeeStackParamList, 'YearSubjects'>;

// The 7 UEE exam subjects per stream. The subjects table has 16 entries
// (IT, PVA, HPE, Agriculture, General Business, Technical Drawing, etc. are
// Learn-tab-only curriculum, not tested in the matriculation exam), so the
// UEE paper list must filter down to just the ones that actually have papers.
//
// `useUeeSubjects` returns the full subject list — filtering happens here so
// the excluded subjects never render as tappable "view this year's paper"
// cards they'd have no content behind.
const UEE_SUBJECTS_BY_STREAM: Record<string, string[]> = {
  natural: ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'aptitude', 'civics'],
  social: ['mathematics', 'geography', 'history', 'economics', 'english', 'aptitude', 'civics'],
};

export function YearSubjectsScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { stream, year } = route.params;
  const { data: subjects } = useUeeSubjects(stream);
  if (!subjects) return null;

  const allowedSlugs = UEE_SUBJECTS_BY_STREAM[stream] ?? UEE_SUBJECTS_BY_STREAM.natural;
  const ueeSubjects = subjects.filter((s) => allowedSlugs.includes(s.slug));

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title={`${year} UEE`} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 20 }]}>
          Choose a subject to view that year's paper.
        </Text>

        {ueeSubjects.map((subject, i) => (
          <Pressable
            key={subject.id}
            onPress={() =>
              navigation.navigate('PaperViewer', { stream, year, subjectId: subject.id, subjectName: subject.name })
            }
          >
            <Card style={i === ueeSubjects.length - 1 ? undefined : styles.cardSpacing}>
              <View style={styles.row}>
                <View style={[styles.iconChip, { backgroundColor: t.colors.brandLight }]}>
                  <Ionicons name={subject.icon as keyof typeof Ionicons.glyphMap} size={20} color={t.colors.brand} />
                </View>
                <Text style={[t.typography.h3, { color: t.colors.textPrimary, flex: 1, marginLeft: 12 }]}>
                  {subject.name}
                </Text>
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