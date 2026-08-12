import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

// Lightweight brand bar for tab-root screens (Home, Learn, …) — gives them
// the same fixed-height structural anchor that TopBar gives pushed screens,
// without a back button or a single "title" to center. `right` lets a screen
// (e.g. Home) surface a couple of quick-glance items without a second row.
// `title`/`icon` let a screen swap the "Compass" wordmark for its own label
// (e.g. Learn) while keeping the same bar structure.
export function AppTopBar({
  title = 'Compass',
  icon = 'compass',
  right,
}: {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.colors.border }]}>
      <View style={styles.brand}>
        <Ionicons name={icon} size={24} color={t.colors.brand} />
        <Text
          style={[
            t.typography.h3,
            { color: t.colors.textPrimary, marginLeft: 8, letterSpacing: 0.3, fontSize: 20 },
          ]}
        >
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
});
