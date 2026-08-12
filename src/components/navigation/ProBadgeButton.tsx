import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Gold reads as "premium" regardless of theme, so — like the exam-hero
// gradient and the Telegram-blue auth button — this is a fixed brand color,
// not a theme token.
export function ProBadgeButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <LinearGradient colors={['#F6D68F', '#D9A441']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
        <Ionicons name="star" size={9} color="#5B3B0A" />
        <Text style={styles.label}>PRO</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', height: 24, paddingHorizontal: 7, borderRadius: 12, gap: 3 },
  label: { color: '#5B3B0A', fontFamily: 'Inter_700Bold', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.2 },
});
