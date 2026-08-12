import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function ProgressBar({ progress, color, trackColor, height = 10 }: {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor ?? t.colors.surfaceAlt, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <View
        style={[
          styles.fill,
          { width: `${pct * 100}%`, backgroundColor: color ?? t.colors.brand, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
