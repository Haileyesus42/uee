import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type AuthMethod = 'phone' | 'telegram';

const TABS: { key: AuthMethod; label: string }[] = [
  { key: 'phone', label: 'Phone' },
  { key: 'telegram', label: 'Telegram' },
];

// Underline tabs (label + colored bar beneath the active one), not the
// pill-segmented control used elsewhere in the app — this screen is
// deliberately mirroring how Binance splits "Phone" vs "Email" registration
// into parallel tabs, and that's the specific visual language of it.
export function AuthMethodTabs({ method, onChange }: { method: AuthMethod; onChange: (method: AuthMethod) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.colors.border }]}>
      {TABS.map((tab) => {
        const active = tab.key === method;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab}>
            <Text
              style={[
                t.typography.bodyStrong,
                { color: active ? t.colors.brand : t.colors.textSecondary, fontSize: 15 },
              ]}
            >
              {tab.label}
            </Text>
            <View style={[styles.underline, { backgroundColor: active ? t.colors.brand : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { marginRight: 28, paddingBottom: 10 },
  underline: { height: 2.5, borderRadius: 2, marginTop: 8, width: '100%' },
});
