import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

type NotificationItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: 'brand' | 'warning' | 'success';
  title: string;
  subtitle: string;
  time: string;
};

const TODAY: NotificationItem[] = [
  {
    id: '1',
    icon: 'flame',
    tint: 'warning',
    title: "Don't lose your streak!",
    subtitle: "You haven't practiced today — keep your 14 day streak alive.",
    time: '2h ago',
  },
  {
    id: '2',
    icon: 'trophy',
    tint: 'success',
    title: 'Achievement unlocked',
    subtitle: 'You earned "100 Questions" for solving 100 practice questions.',
    time: '5h ago',
  },
];

const EARLIER: NotificationItem[] = [
  {
    id: '3',
    icon: 'bulb',
    tint: 'brand',
    title: 'New Smart Insight',
    subtitle: 'Unity noticed you usually struggle with Functions.',
    time: 'Yesterday',
  },
  {
    id: '4',
    icon: 'checkmark-circle',
    tint: 'success',
    title: 'Daily goal reached',
    subtitle: 'You studied for 15 minutes yesterday. Nice work!',
    time: '2 days ago',
  },
  {
    id: '5',
    icon: 'time',
    tint: 'warning',
    title: 'Exam countdown',
    subtitle: '62 days left until your UEE. Stay consistent!',
    time: '3 days ago',
  },
];

export function NotificationsScreen({ navigation }: Props) {
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Notifications" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <SectionLabel>Today</SectionLabel>
        {TODAY.map((item) => (
          <NotificationRow key={item.id} item={item} />
        ))}

        <SectionLabel>Earlier</SectionLabel>
        {EARLIER.map((item) => (
          <NotificationRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text style={[t.typography.caption, { color: t.colors.textSecondary, letterSpacing: 0.5, marginTop: 16, marginBottom: 10 }]}>
      {children.toUpperCase()}
    </Text>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const t = useTheme();
  const tintMap = {
    brand: { bg: t.colors.brandLight, fg: t.colors.brand },
    warning: { bg: t.colors.warningLight, fg: t.colors.warning },
    success: { bg: t.colors.successLight, fg: t.colors.success },
  } as const;
  const tint = tintMap[item.tint];

  return (
    <View style={styles.row}>
      <View style={[styles.iconChip, { backgroundColor: tint.bg }]}>
        <Ionicons name={item.icon} size={17} color={tint.fg} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.rowHeader}>
          <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, flex: 1 }]}>{item.title}</Text>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{item.time}</Text>
        </View>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>{item.subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', marginBottom: 16 },
  iconChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start' },
});
