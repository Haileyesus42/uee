import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/buttons/Button';
import { LearningJourney } from '../../components/home/LearningJourney';
import { useOnboardingFlow } from '../../navigation/OnboardingFlowContext';

export function PersonalizedPathScreen() {
  const t = useTheme();
  const { complete } = useOnboardingFlow();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingTop: t.spacing.xl, flexGrow: 1 }}>
        <Text style={[t.typography.caption, { color: t.colors.brand, letterSpacing: 0.5 }]}>YOUR PATH IS READY</Text>
        <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: 6 }]}>
          Start with Algebra
        </Text>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 6 }]}>
          Based on your diagnostic, we're starting you here — you'll unlock the rest as you go.
        </Text>

        <View style={{ marginTop: 32 }}>
          <LearningJourney
            subject="Algebra"
            items={[
              { label: 'Algebra Foundations', status: 'current' },
              { label: 'Linear Equations', status: 'available' },
              { label: 'Quadratic Equations', status: 'locked' },
              { label: 'Functions', status: 'locked' },
              { label: 'Calculus', status: 'locked' },
            ]}
          />
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button label="Start Learning" onPress={complete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
