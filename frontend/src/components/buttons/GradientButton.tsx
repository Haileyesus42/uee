import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// A fixed brand-green gradient used for every primary CTA regardless of theme
// (light/dark only change the page around it, not this button).
export function GradientButton({
  label,
  onPress,
  style,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={['#1a7a60', '#0B5E4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, style]}
      >
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#0B5E4B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  label: { color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 12.5, fontWeight: '700' },
  pressed: { opacity: 0.9 },
});
