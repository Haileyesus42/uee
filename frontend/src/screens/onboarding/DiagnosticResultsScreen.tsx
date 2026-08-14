import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/buttons/Button';
import { ProgressBar } from '../../components/progress/ProgressBar';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DiagnosticResults'>;

const BREAKDOWN = [
  { subject: 'Mathematics', level: 0.62 },
  { subject: 'Physics', level: 0.41 },
  { subject: 'English', level: 0.78 },
];

export function DiagnosticResultsScreen({ navigation }: Props) {
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingTop: t.spacing.xl, flexGrow: 1 }}>
        <View style={[styles.badge, { backgroundColor: t.colors.brandLight }]}>
          <Ionicons name="checkmark" size={26} color={t.colors.brand} />
        </View>
        <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: 16 }]}>Here's where you stand</Text>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 6 }]}>
          Your learning path will focus more time on the areas that need it most.
        </Text>

        <View style={{ marginTop: 32 }}>
          {BREAKDOWN.map((row) => (
            <View key={row.subject} style={{ marginBottom: 20 }}>
              <View style={styles.rowHeader}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{row.subject}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
                  {Math.round(row.level * 100)}%
                </Text>
              </View>
              <ProgressBar progress={row.level} height={6} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button label="See My Learning Path" onPress={() => navigation.navigate('PersonalizedPath')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
});
