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
import { LeaderboardTableHeader } from '../../components/leaderboard/LeaderboardTableHeader';
import { LeaderboardPeriod, LeaderboardScope } from '../../data/leaderboard';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useMe } from '../../hooks/useProfile';
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
  const { data: profile } = useMe();

  const entries = data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = entries.find((e) => e.isCurrentUser);
  const myRank = data?.currentUser?.rank ?? currentUser?.rank ?? null;
  const schoolName = data?.school?.name ?? null;
  const noSchool = data?.reason === 'no_school';
  // Rank is outside the top-20 page but the user still has a rank — the
  // brief requires showing their position even when it's not on this page.
  const showSelfRow = !!(data?.currentUser && !currentUser);

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

            {/* Table wrapper — single card, header strip inside, hairline
                dividers between rows. Same container style as the app's other
                surface cards (border + radius + overflow hidden), so the rows
                render as one coherent block rather than N floating cards. */}
            {rest.length > 0 && (
              <View
                style={[
                  styles.tableWrap,
                  { backgroundColor: t.colors.surface, borderColor: t.colors.border },
                ]}
              >
                <LeaderboardTableHeader />
                {rest.map((entry, idx) => (
                  <LeaderboardRow
                    key={entry.rank}
                    entry={entry}
                    isLast={idx === rest.length - 1}
                  />
                ))}
              </View>
            )}

            {/* Current user, when their rank is outside the top-20 page.
                Rendered as a separate single-row card with a "…" divider above,
                so it's clearly the user's position, not a continuation of the
                visible list. */}
            {showSelfRow && data?.currentUser && (
              <>
                <View style={styles.ellipsisWrap}>
                  <Text style={{ color: t.colors.textSecondary, fontSize: 14, letterSpacing: 2 }}>···</Text>
                </View>
                <View
                  style={[
                    styles.tableWrap,
                    { backgroundColor: t.colors.surface, borderColor: t.colors.border },
                  ]}
                >
                  <LeaderboardRow
                    entry={{
                      rank: data.currentUser.rank,
                      userId: 'self',
                      name: profile?.name ?? 'You',
                      avatarEmoji: profile?.avatarEmoji ?? '🧑‍🎓',
                      hasAvatarPhoto: profile?.hasAvatarPhoto ?? false,
                      xp: data.currentUser.xp,
                      isCurrentUser: true,
                      grade: profile?.grade ?? null,
                    }}
                    isLast
                  />
                </View>
              </>
            )}
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
  tableWrap: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ellipsisWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});