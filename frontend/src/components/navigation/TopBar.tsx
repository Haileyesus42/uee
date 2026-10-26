import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export function TopBar({
  title,
  titleAlign = 'center',
  onBack,
  action,
}: {
  title?: string;
  titleAlign?: 'left' | 'center' | 'right';
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  const t = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={t.colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <Text
          style={[t.typography.h3, styles.title, { color: t.colors.textPrimary, textAlign: titleAlign }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <View style={[styles.side, styles.sideRight]}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 44 },
  // minWidth, not width: the left slot is always just a back chevron (never
  // wider than this), but the right slot can carry something wider — e.g.
  // UeeHomeScreen's Pro badge + avatar — which needs room to actually grow
  // instead of silently overflowing a fixed-width box.
  side: { minWidth: 40 },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  backButton: { width: 32, height: 32, alignItems: 'flex-start', justifyContent: 'center' },
});
