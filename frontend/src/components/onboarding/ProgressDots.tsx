import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function ProgressDots({ step, total }: { step: number; total: number }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === step ? 18 : 6,
              backgroundColor: i <= step ? t.colors.brand : t.colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
});
