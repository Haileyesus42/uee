import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export type PaperMode = 'study' | 'exam';

const OPTIONS: { key: PaperMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'study', label: 'Study Mode', icon: 'book-outline' },
  { key: 'exam', label: 'Exam Mode', icon: 'timer-outline' },
];

export function PaperModeSelector({ mode, onChange }: { mode: PaperMode; onChange: (mode: PaperMode) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: t.colors.surfaceAlt }]}>
      {OPTIONS.map((opt) => {
        const active = opt.key === mode;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.chip,
              active && [styles.chipActive, { backgroundColor: t.colors.surface }, t.shadow.card],
            ]}
          >
            <Ionicons name={opt.icon} size={14} color={active ? t.colors.brand : t.colors.textSecondary} />
            <Text
              style={[
                t.typography.bodyStrong,
                { color: active ? t.colors.brand : t.colors.textSecondary, fontSize: 13, marginLeft: 6 },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10 },
  chipActive: {},
});
