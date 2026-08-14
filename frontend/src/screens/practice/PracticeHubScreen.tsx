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
import { PracticeStatsCard } from '../../components/practice/PracticeStatsCard';
import { PracticeModeCard, PracticeModeTint } from '../../components/practice/PracticeModeCard';
import { useMe } from '../../hooks/useProfile';
import { PracticeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<PracticeStackParamList, 'PracticeHub'>,
  BottomTabScreenProps<MainTabParamList>
>;

const MODES: {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: PracticeModeTint;
  onPress: (nav: Props['navigation']) => void;
}[] = [
  {
    id: 'quick',
    title: 'Quick Practice',
    subtitle: 'Mixed questions from any subject',
    meta: '20 questions · Mixed',
    icon: 'flash-outline',
    tint: 'brand',
    onPress: (nav) => nav.navigate('QuizSetup', { mode: 'practice' }),
  },
  {
    id: 'weak',
    title: 'Weak Topics',
    subtitle: 'Focus on Physics — needs practice',
    meta: 'Physics · 58% accuracy',
    icon: 'trending-up-outline',
    tint: 'warning',
    onPress: (nav) => nav.navigate('QuizSetup', { mode: 'practice', presetSubjectId: 'physics' }),
  },
  {
    id: 'mock',
    title: 'Mock Exams',
    subtitle: 'Full-length, timed simulations',
    meta: '6 exams · Timed',
    icon: 'time-outline',
    tint: 'success',
    onPress: (nav) => nav.navigate('MockExamsList'),
  },
];

export function PracticeHubScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: profile } = useMe();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <AppTopBar
          title="Practice"
          icon="flash-outline"
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
            <Ionicons name="flash-outline" size={16} color={t.colors.brand} />
          </View>
          <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginLeft: 10, flex: 1 }]}>
            Sharpen your skills with <Text style={{ color: t.colors.brand }}>{MODES.length}</Text> practice modes
          </Text>
        </View>

        <View style={{ marginTop: 18 }}>
          <PracticeStatsCard
            accuracy={profile?.accuracy ?? 0}
            streakDays={profile?.streakDays ?? 0}
            questionsAnswered={profile?.questionsSolved ?? 0}
          />
        </View>

        <View style={{ marginTop: 18, gap: 12 }}>
          {MODES.map((mode) => (
            <PracticeModeCard
              key={mode.id}
              title={mode.title}
              subtitle={mode.subtitle}
              meta={mode.meta}
              icon={mode.icon}
              tint={mode.tint}
              onPress={() => mode.onPress(navigation)}
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
});
