import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Grade, GRADES } from '../../data/curriculum';

export function GradeSelector({ grade, onChange }: { grade: Grade; onChange: (grade: Grade) => void }) {
  const t = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: t.colors.surfaceAlt }]}>
      {GRADES.map((g) => {
        const active = g === grade;
        return (
          <Pressable
            key={g}
            onPress={() => onChange(g)}
            style={[
              styles.chip,
              active && [styles.chipActive, { backgroundColor: t.colors.surface }, t.shadow.card],
            ]}
          >
            <Text
              style={[
                t.typography.bodyStrong,
                { color: active ? t.colors.brand : t.colors.textSecondary, fontSize: 13 },
              ]}
            >
              {g}
            </Text>
            <Text
              style={[
                t.typography.caption,
                { color: active ? t.colors.brand : t.colors.textSecondary, fontSize: 8, marginTop: -1 },
              ]}
            >
              GRADE
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  chipActive: {},
});
