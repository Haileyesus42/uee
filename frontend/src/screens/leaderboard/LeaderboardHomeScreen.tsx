import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { AppTopBar } from '../../components/navigation/AppTopBar';
import { TopBarActions } from '../../components/navigation/TopBarActions';
import { LeaderboardPeriodSelector } from '../../components/leaderboard/LeaderboardPeriodSelector';
import { LeaderboardPodium } from '../../components/leaderboard/LeaderboardPodium';
import { LeaderboardRow } from '../../components/leaderboard/LeaderboardRow';
import { LeaderboardPeriod } from '../../data/leaderboard';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { LeaderboardStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<LeaderboardStackParamList, 'LeaderboardHome'>,
  BottomTabScreenProps<MainTabParamList>
>;

export function LeaderboardHomeScreen({ navigation }: Props) {
  const t = useTheme();
  const [period, setPeriod] = useState<LeaderboardPeriod>('allTime');
  const { data } = useLeaderboard(period);

  const entries = data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = entries.find((e) => e.isCurrentUser);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <AppTopBar
          title="Leaderboard"
          icon="podium-outline"
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
            <Ionicons name="trophy-outline" size={16} color={t.colors.brand} />
          </View>
          <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginLeft: 10, flex: 1 }]}>
            {currentUser ? (
              <>
                You're ranked <Text style={{ color: t.colors.brand }}>#{currentUser.rank}</Text> · keep going
              </>
            ) : (
              'Earn XP to join the leaderboard'
            )}
          </Text>
        </View>

        <View style={{ marginTop: 18 }}>
          <LeaderboardPeriodSelector period={period} onChange={setPeriod} />
        </View>

        {data && !data.available ? (
          <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 24, textAlign: 'center' }]}>
            {period === 'weekly' ? 'Weekly' : 'Monthly'} rankings are coming soon — check All-Time for now.
          </Text>
        ) : entries.length === 0 ? (
          <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 24, textAlign: 'center' }]}>
            No one has earned XP yet — be the first!
          </Text>
        ) : (
          <>
            <LeaderboardPodium top3={top3} />
            <View style={{ marginTop: 22 }}>
              {rest.map((entry) => (
                <LeaderboardRow key={entry.rank} entry={entry} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center' },
  subtitleIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
