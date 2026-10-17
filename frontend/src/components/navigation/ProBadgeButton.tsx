import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../hooks/useBilling';

// Gold reads as "premium" regardless of theme, so — like the exam-hero
// gradient and the Telegram-blue auth button — this is a fixed brand color,
// not a theme token.
//
// Doubles as a status chip once the user is actually subscribed — a paying
// user was previously shown the exact same "buy this" CTA on every screen,
// including one that led to a page telling them they already had it.
export function ProBadgeButton({ onPress }: { onPress?: () => void }) {
  const { data: subscription } = useSubscription();
  const isPro = subscription?.status === 'active';

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <LinearGradient colors={['#F6D68F', '#D9A441']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
        <Ionicons name={isPro ? 'checkmark-circle' : 'star'} size={9} color="#5B3B0A" />
        <Text style={styles.label}>{isPro ? 'PRO' : 'TRIAL'}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', height: 24, paddingHorizontal: 7, borderRadius: 12, gap: 3 },
  label: { color: '#5B3B0A', fontFamily: 'Inter_700Bold', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.2 },
});
