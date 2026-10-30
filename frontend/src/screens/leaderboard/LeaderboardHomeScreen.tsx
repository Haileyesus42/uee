import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { AppTopBar } from '../../components/navigation/AppTopBar';
import { TopBarActions } from '../../components/navigation/TopBarActions';
import { LeaderboardPeriodSelector } from '../../components/leaderboard/LeaderboardPeriodSelector';
import { LeaderboardScopeSelector } from '../../components/leaderboard/LeaderboardScopeSelector';
import { LeaderboardPodium } from '../../components/leaderboard/LeaderboardPodium';
import { LeaderboardRow } from '../../components/leaderboard/LeaderboardRow';
import { LeaderboardPeriod, LeaderboardScope } from '../../data/leaderboard';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { LeaderboardStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<LeaderboardStackParamList, 'LeaderboardHome'>,
  BottomTabScreenProps<MainTabParamList>
>;

export function LeaderboardHomeScreen({ navigation }: Props) {
  const t = useTheme();
  const [period, setPeriod] = useState<LeaderboardPeriod>('allTime');
  const [scope, setScope] = useState<LeaderboardScope>('national');
  const { data } = useLeaderboard(period, scope);

  const entries = data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = entries.find((e) => e.isCurrentUser);
  const myRank = data?.currentUser?.rank ?? currentUser?.rank ?? null;
  const schoolName = data?.school?.name ?? null;
  const noSchool = data?.reason === 'no_school';

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
            <Ionicons name="trophy-outline" size={11} color={t.colors.brand} />
          </View>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8, flex: 1 }]}>
            {myRank ? (
              <>
                You're ranked{' '}
                <Text style={{ color: t.colors.brand, fontFamily: 'Inter_600SemiBold' }}>
                  #{myRank}
                </Text>
                {' '}· keep going
              </>
            ) : (
              'Earn XP to join the leaderboard'
            )}
          </Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <LeaderboardScopeSelector scope={scope} onChange={setScope} />
        </View>

        <View style={{ marginTop: 8 }}>
          <LeaderboardPeriodSelector period={period} onChange={setPeriod} />
        </View>

        {scope === 'school' && schoolName && (
          <Text
            style={[
              t.typography.caption,
              { color: t.colors.textSecondary, marginTop: 12, textAlign: 'center' },
            ]}
          >
            {schoolName}
          </Text>
        )}

        {data && !data.available && noSchool ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏫</Text>
            <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginTop: 12, textAlign: 'center' }]}>
              Join your school's leaderboard!
            </Text>
            <Text
              style={[
                t.typography.body,
                { color: t.colors.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
              ]}
            >
              Select your school to compete with your classmates.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('SchoolPicker')}
              style={[styles.emptyCta, { backgroundColor: t.colors.brand }]}
            >
              <Text style={[t.typography.bodyStrong, { color: t.colors.textInverse }]}>
                Select my school
              </Text>
            </Pressable>
          </View>
        ) : entries.length === 0 ? (
          <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
            No one has earned XP yet — be the first!
          </Text>
        ) : (
          <>
            <LeaderboardPodium top3={top3} />
            <View style={{ marginTop: 14 }}>
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
  subtitleIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 40, paddingHorizontal: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyCta: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});