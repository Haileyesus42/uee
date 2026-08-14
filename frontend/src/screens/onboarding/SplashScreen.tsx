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
        <Ionicons name="compass" size={30} color={t.colors.textInverse} />
      </View>
      <Text style={[t.typography.h1, { color: t.colors.textInverse, marginTop: 16 }]}>Compass</Text>
      <Text style={[t.typography.body, { color: 'rgba(255,255,255,0.85)', marginTop: 4 }]}>
        Your path to university starts here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
