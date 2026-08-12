import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../cards/Card';
import { GradientButton } from '../buttons/GradientButton';

export function SmartInsightCard({
  message,
  ctaLabel,
  onPress,
}: {
  message: string;
  ctaLabel: string;
  onPress?: () => void;
}) {
  const t = useTheme();

  return (
    <Card style={styles.card}>
      <LinearGradient colors={['#8a63ff', '#6a3ff0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bulb}>
        <Text style={styles.bulbEmoji}>💡</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={[styles.title, { color: t.colors.brand }]}>Smart Insight</Text>
        <Text style={[styles.message, { color: t.colors.textSecondary }]}>{message}</Text>
      </View>

      <GradientButton label={ctaLabel} onPress={onPress} style={styles.cta} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  bulb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c5cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  bulbEmoji: { fontSize: 18 },
  content: { flex: 1, marginLeft: 11, marginRight: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 12, fontWeight: '700' },
  message: { fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  cta: {},
});
