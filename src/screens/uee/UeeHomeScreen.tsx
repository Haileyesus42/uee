import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { AppTopBar } from '../../components/navigation/AppTopBar';
import { TopBarActions } from '../../components/navigation/TopBarActions';
import { PastPapersStatsCard } from '../../components/uee/PastPapersStatsCard';
import { YearCard, YearCardTint } from '../../components/uee/YearCard';
import { PAST_PAPER_YEARS } from '../../data/pastPapers';
import { SUBJECTS } from '../../data/curriculum';
import { UeeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<UeeStackParamList, 'UeeHome'>,
  BottomTabScreenProps<MainTabParamList>
>;

const TINTS: YearCardTint[] = ['brand', 'warning', 'success', 'secondary'];

export function UeeHomeScreen({ navigation }: Props) {
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <AppTopBar
          title="UEE"
          icon="document-text-outline"
          right={
            <TopBarActions
              onPressPro={() => navigation.navigate('Profile', { screen: 'Premium' })}
              onPressProfile={() => navigation.navigate('Profile', { screen: 'ProfileHome' })}
            />
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <View style={styles.subtitleRow}>
          <View style={[styles.subtitleIcon, { backgroundColor: t.colors.brandLight }]}>
            <Ionicons name="document-text-outline" size={16} color={t.colors.brand} />
          </View>
          <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginLeft: 10, flex: 1 }]}>
            <Text style={{ color: t.colors.brand }}>{PAST_PAPER_YEARS.length}+</Text> years of past UEE papers, with
            full solutions
          </Text>
        </View>

        <View style={{ marginTop: 18 }}>
          <PastPapersStatsCard years={PAST_PAPER_YEARS.length} subjectsPerYear={SUBJECTS.length} />
        </View>

        <View style={[styles.grid, { marginTop: 18 }]}>
          {PAST_PAPER_YEARS.map((year, i) => (
            <YearCard
              key={year}
              year={year}
              subjectCount={SUBJECTS.length}
              tint={TINTS[i % TINTS.length]}
              onPress={() => navigation.navigate('YearSubjects', { year })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center' },
  subtitleIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
