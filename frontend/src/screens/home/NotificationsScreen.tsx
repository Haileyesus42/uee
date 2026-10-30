import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { useMarkAllNotificationsRead, useNotifications } from '../../hooks/useNotifications';
import { AppNotification } from '../../api/types';
import { HomeStackParamList, MainTabParamList } from '../../navigation/types';

// CompositeScreenProps so navigation can reach both the HomeStack screens
// (back arrow, existing navigations) AND the tab-navigator screens (Profile),
// since the profile icon in the top-right opens Profile which lives in the
// tab navigator, not inside HomeStack.
type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Notifications'>,
  BottomTabScreenProps<MainTabParamList>
>;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationsScreen({ navigation }: Props) {
  const t = useTheme();
  const { data, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  // Opening this screen is the "I've seen these" signal — same as a phone's
  // native notification shade clearing its badge once you pull it down.
  useFocusEffect(
    useCallback(() => {
      if (data && data.unreadCount > 0) markAllRead.mutate();
      // Only ever needs to fire once per focus, when there's something to clear —
      // re-running on every data refetch would just resend the same no-op mutation.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.unreadCount])
  );

  const notifications = data?.notifications ?? [];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar
          title="Notifications"
          onBack={() => navigation.goBack()}
          action={
            <Pressable
              onPress={() => navigation.navigate('Profile', { screen: 'ProfileHome' })}
              hitSlop={10}
              style={styles.profileButton}
            >
              <Ionicons name="person-circle-outline" size={24} color={t.colors.textSecondary} />
            </Pressable>
          }
        />
      </View>

      {isLoading ? (
        <View style={[styles.flex, styles.center]}>
          <ActivityIndicator color={t.colors.brand} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ padding: t.spacing.md, alignItems: 'center' }}>
          <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 24, textAlign: 'center' }]}>
            Nothing here yet — notifications are coming soon.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: t.spacing.md, gap: 10 }}>
          {notifications.map((item: AppNotification) => (
            <View
              key={item.id}
              style={[
                styles.card,
                t.shadow.card,
                { backgroundColor: t.colors.surface, borderColor: t.colors.border },
              ]}
            >
              <View style={[styles.iconBadge, { backgroundColor: t.colors.brandLight }]}>
                <Ionicons name="sparkles" size={20} color={t.colors.brand} />
              </View>

              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, flex: 1 }]}>{item.title}</Text>
                  {!item.read && <View style={[styles.unreadDot, { backgroundColor: t.colors.error }]} />}
                </View>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>{item.body}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 6, opacity: 0.7 }]}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  profileButton: { width: 32, height: 32, alignItems: 'flex-end', justifyContent: 'center' },
});