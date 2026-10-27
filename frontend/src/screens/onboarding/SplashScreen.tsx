import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const t = useTheme();

  useEffect(() => {
    const id = setTimeout(() => navigation.replace('Welcome'), 1100);
    return () => clearTimeout(id);
  }, [navigation]);

  return (
    <View style={[styles.flex, { backgroundColor: t.colors.brand }]}>
      <View style={[styles.mark, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
        <Ionicons name="book" size={30} color={t.colors.textInverse} />
      </View>
      <Text style={[t.typography.h1, { color: t.colors.textInverse, marginTop: 16 }]}>Tizata</Text>
      <View style={styles.subRow}>
        <View style={[styles.dash, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
        <Text style={[t.typography.bodyStrong, styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>UEE</Text>
        <View style={[styles.dash, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
      </View>
      <Text style={[t.typography.body, { color: 'rgba(255,255,255,0.85)', marginTop: 10 }]}>
        Learn · Practice · Succeed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  subtitle: { letterSpacing: 2 },
  dash: { width: 16, height: 1.5, borderRadius: 1 },
});
