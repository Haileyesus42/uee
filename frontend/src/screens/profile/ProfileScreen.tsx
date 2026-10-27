import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { Avatar } from '../../components/common/Avatar';
import { useMe } from '../../hooks/useProfile';
import { useAuth } from '../../auth/AuthProvider';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

const MENU: { id: keyof ProfileStackParamList; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'EditProfile', label: 'Edit Profile', icon: 'person-outline' },
  { id: 'Statistics', label: 'Statistics & Analytics', icon: 'bar-chart-outline' },
  { id: 'MistakesBook', label: 'Mistakes Book', icon: 'alert-circle-outline' },
  { id: 'Achievements', label: 'Achievements & Badges', icon: 'trophy-outline' },
  { id: 'Settings', label: 'Settings', icon: 'settings-outline' },
  { id: 'Premium', label: 'Tizata Pro', icon: 'star-outline' },
  { id: 'Help', label: 'Help & Support', icon: 'help-circle-outline' },
];

export function ProfileScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: profile } = useMe();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar
          title="Profile"
          onBack={() => navigation.getParent()?.goBack()}
          action={
            <Pressable onPress={t.toggleScheme} hitSlop={8} style={[styles.themeButton, { backgroundColor: t.colors.surfaceAlt }]}>
              <Ionicons name={t.scheme === 'dark' ? 'sunny' : 'moon'} size={16} color={t.colors.textSecondary} />
            </Pressable>
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Card style={styles.identityCard}>
          <View style={styles.identityRow}>
            <Avatar
              userId={profile?.id ?? ''}
              hasPhoto={profile?.hasAvatarPhoto ?? false}
              emoji={profile?.avatarEmoji ?? '🧑🎓'}
              size={46}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, fontSize: 15 }]}>
                {profile?.name || 'Tizata Student'}
              </Text>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 1, fontSize: 11 }]}>
                Level {profile?.level ?? 1} · {profile?.levelTitle ?? 'New Learner'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: t.colors.border }]} />

          <View style={styles.statsRow}>
            <Stat icon="flash" value={(profile?.xp ?? 0).toLocaleString()} label="XP" tint="warning" />
            <Stat icon="flame" value={String(profile?.streakDays ?? 0)} label="Day Streak" tint="warning" />
            <Stat
              icon="checkmark-circle"
              value={`${Math.round((profile?.accuracy ?? 0) * 100)}%`}
              label="Accuracy"
              tint="success"
            />
          </View>
        </Card>

        <Card padded={false} style={{ marginTop: 14 }}>
          {MENU.map((item, i) => (
            <Pressable key={item.id} onPress={() => navigation.navigate(item.id as never)}>
              <View
                style={[
                  styles.row,
                  {
                    borderBottomColor: t.colors.border,
                    borderBottomWidth: i === MENU.length - 1 ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={[styles.iconChip, { backgroundColor: t.colors.brandLight }]}>
                  <Ionicons name={item.icon} size={15} color={t.colors.brand} />
                </View>
                <Text style={[t.typography.caption, { color: t.colors.textPrimary, flex: 1, marginLeft: 10, fontWeight: '600' }]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={t.colors.textSecondary} />
              </View>
            </Pressable>
          ))}
        </Card>

        <Card padded={false} style={{ marginTop: 14 }}>
          <Pressable onPress={logout}>
            <View style={styles.row}>
              <View style={[styles.iconChip, { backgroundColor: t.colors.errorLight }]}>
                <Ionicons name="log-out-outline" size={15} color={t.colors.error} />
              </View>
              <Text
                style={[t.typography.caption, { color: t.colors.error, flex: 1, marginLeft: 10, fontWeight: '600' }]}
              >
                Log Out
              </Text>
            </View>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tint: 'warning' | 'success';
}) {
  const t = useTheme();
  const color = tint === 'warning' ? t.colors.xp : t.colors.success;
  return (
    <View style={styles.statCol}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 4, fontSize: 13 }]}>
        {value}
      </Text>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary, fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  themeButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  identityCard: { paddingVertical: 14 },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statCol: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  iconChip: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
