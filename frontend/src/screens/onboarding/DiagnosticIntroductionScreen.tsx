import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { useTheme } from '../../theme/ThemeProvider';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DiagnosticIntroduction'>;

export function DiagnosticIntroductionScreen({ navigation }: Props) {
  const t = useTheme();

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      icon="analytics-outline"
      eyebrow="QUICK DIAGNOSTIC"
      title="Let's see where you're starting from"
      subtitle="A short set of questions across your subjects — there's no pass or fail, it just shapes your learning path."
      primaryLabel="Start Diagnostic"
      onPrimaryPress={() => navigation.navigate('DiagnosticQuestion')}
    >
      <View style={styles.metaRow}>
        <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>3 questions</Text>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>≈ 2 minutes</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  metaRow: {},
});
