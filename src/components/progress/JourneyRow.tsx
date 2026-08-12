import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export type JourneyStatus = 'completed' | 'current' | 'available' | 'locked';
export type JourneyItem = { label: string; status: JourneyStatus };

// One node in a learning-path list: glyph + label. Shared by the Home path
// preview and the full Subject Path / Topic Detail screens so a lesson node
// looks identical everywhere it appears.
export function JourneyRow({
  item,
  isLast,
  onPress,
}: {
  item: JourneyItem;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const { label, status } = item;

  return (
    <Pressable
      onPress={status === 'locked' ? undefined : onPress}
      style={[styles.row, { marginBottom: isLast ? 0 : 18, opacity: status === 'locked' ? 0.5 : 1 }]}
    >
      <View style={styles.glyph}>
        {status === 'completed' && <Ionicons name="checkmark" size={16} color={t.colors.textSecondary} />}
        {status === 'current' && <View style={[styles.dot, { backgroundColor: t.colors.brand }]} />}
        {(status === 'available' || status === 'locked') && (
          <View style={[styles.dotOutline, { borderColor: t.colors.border }]} />
        )}
      </View>
      <Text
        style={[
          status === 'current' ? t.typography.bodyStrong : t.typography.body,
          {
            marginLeft: 12,
            color: status === 'current' ? t.colors.brand : status === 'completed' ? t.colors.textSecondary : t.colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  glyph: { width: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOutline: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
});
