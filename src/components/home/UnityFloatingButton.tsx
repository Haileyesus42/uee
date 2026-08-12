import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { RobotHead } from './RobotHead';

// Persistent floating entry point into Unity — replaces the old full "AI
// Personal Tutor" card. Bobs gently up and down for a "hovering" feel.
// White bubble instead of a purple/blue gradient wash, so the robot's own
// white/silver + purple-accent coloring reads clearly instead of being
// flattened under another layer of brand color.
export function UnityFloatingButton({ onPress, bottom = 18 }: { onPress?: () => void; bottom?: number }) {
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
      <Pressable onPress={onPress} hitSlop={8} style={styles.bubble}>
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5032b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
});
