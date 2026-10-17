import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { useAuth } from '../../auth/AuthProvider';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const t = useTheme();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Settings" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <SectionLabel>Account</SectionLabel>
        <SettingsRow icon="person-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <SettingsRow icon="lock-closed-outline" label="Change Password" onPress={() => {}} />

        <SectionLabel>Preferences</SectionLabel>
        <SettingsRow
          icon="moon-outline"
          label="Dark Mode"
          trailing={<Switch value={t.scheme === 'dark'} onValueChange={t.toggleScheme} />}
        />
        <SettingsRow
          icon="notifications-outline"
          label="Notifications"
          trailing={<Switch value={notifications} onValueChange={setNotifications} />}
        />
        <SettingsRow icon="language-outline" label="Language" value="English" onPress={() => {}} />

        <SectionLabel>Support</SectionLabel>
        <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={() => navigation.navigate('Help')} />
        <SettingsRow icon="star-outline" label="Go Premium" onPress={() => navigation.navigate('Premium')} />

        <SectionLabel>Account Actions</SectionLabel>
        <SettingsRow icon="log-out-outline" label="Log Out" destructive onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text style={[t.typography.caption, { color: t.colors.textSecondary, letterSpacing: 0.5, marginTop: 20, marginBottom: 8 }]}>
      {children.toUpperCase()}
    </Text>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  destructive,
  trailing,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  destructive?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const t = useTheme();
  const color = destructive ? t.colors.error : t.colors.textPrimary;

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, { borderBottomColor: t.colors.border }]}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[t.typography.body, { color, flex: 1, marginLeft: 12 }]}>{label}</Text>
      {value && <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginRight: 6 }]}>{value}</Text>}
      {trailing ?? (onPress && <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} />)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
