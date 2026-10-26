import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { RobotHead } from './RobotHead';
import { useTheme } from '../../theme/ThemeProvider';

// Persistent floating entry point into Unity — replaces the old full "AI
// Personal Tutor" card. Bobs gently up and down for a "hovering" feel.
// An elevated-surface bubble (not a flat white one, and not a purple/blue
// gradient wash) so the robot's own white/silver + purple-accent coloring
// reads clearly against it in both themes, instead of being flattened under
// another layer of brand color or stranding a pure-white disc in dark mode.
export function UnityFloatingButton({ onPress, bottom = 18 }: { onPress?: () => void; bottom?: number }) {
  const t = useTheme();
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View style={[styles.wrap, { bottom, transform: [{ translateY }] }]}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        style={[
          styles.bubble,
          t.shadow.raised,
          { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border },
        ]}
      >
        <RobotHead size={34} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16 },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
