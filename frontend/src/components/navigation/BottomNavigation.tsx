import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

// This is a fully custom tab bar (see MainTabNavigator), so React Navigation's
// own safe-area handling for its default tab bar never applies here — this
// component owns its bottom inset. CONTENT_HEIGHT is everything below, up to
// but not including that inset, so the floating assistant button in
// MainTabNavigator can clear this bar without a hand-tuned magic number.
export const BOTTOM_NAV_CONTENT_HEIGHT = 56;

// 'profile' has no entry in ITEMS below — Profile is reached via the avatar
// button in each tab's AppTopBar, not the bottom bar — but the key stays in
// this union so the exhaustive route maps in MainTabNavigator still type-check.
export type NavKey = 'home' | 'learn' | 'practice' | 'uee' | 'leaderboard' | 'profile';

const ITEMS: { key: NavKey; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'learn', label: 'Learn', icon: 'book-outline', iconActive: 'book' },
  { key: 'practice', label: 'Practice', icon: 'flash-outline', iconActive: 'flash' },
  { key: 'uee', label: 'UEE', icon: 'document-text-outline', iconActive: 'document-text' },
  { key: 'leaderboard', label: 'Ranking', icon: 'podium-outline', iconActive: 'podium' },
];

export function BottomNavigation({ active, onChange }: { active: NavKey; onChange?: (key: NavKey) => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.colors.surface, borderTopColor: t.colors.border, paddingBottom: 2 + insets.bottom },
      ]}
    >
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange?.(item.key)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={isActive ? item.iconActive : item.icon}
              size={18}
              color={isActive ? t.colors.brand : t.colors.textSecondary}
            />
            <Text
              style={[
                t.typography.caption,
                { color: isActive ? t.colors.brand : t.colors.textSecondary, marginTop: 3, fontSize: 10 },
              ]}
            >
              {item.label}
            </Text>
            {isActive && <View style={[styles.underline, { backgroundColor: t.colors.brand }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  item: { flex: 1, alignItems: 'center', paddingBottom: 5, position: 'relative' },
  underline: { position: 'absolute', bottom: 0, width: 26, height: 3, borderRadius: 3 },
});
