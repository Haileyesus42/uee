import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

// No backend notification model exists yet — this used to show a fixed set of
// hardcoded example items (same ones every user, every day, never changing),
// which reads as a real activity feed but isn't one. An honest empty state
// (same pattern as the Leaderboard's weekly/monthly "coming soon") until real
// notifications are wired up.
export function NotificationsScreen({ navigation }: Props) {
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Notifications" onBack={() => navigation.goBack()} />
      </View>

      <View style={{ padding: t.spacing.md, alignItems: 'center' }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 24, textAlign: 'center' }]}>
          Nothing here yet — notifications are coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
