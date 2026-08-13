import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../buttons/Button';
import { TopBar } from '../navigation/TopBar';
import { ProgressDots } from './ProgressDots';

export function OnboardingLayout({
  onBack,
  step,
  totalSteps,
  icon,
  eyebrow,
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondaryPress,
}: {
  onBack?: () => void;
  step?: number;
  totalSteps?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <View style={[styles.header, { paddingHorizontal: t.spacing.md }]}>
        <TopBar onBack={onBack} />
        {step !== undefined && totalSteps ? (
          <View style={{ marginTop: 4 }}>
            <ProgressDots step={step} total={totalSteps} />
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: t.spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        {icon ? (
          <View style={[styles.iconChip, { backgroundColor: t.colors.brandLight }]}>
            <Ionicons name={icon} size={26} color={t.colors.brand} />
          </View>
        ) : null}

        {eyebrow ? (
          <Text style={[t.typography.caption, { color: t.colors.brand, letterSpacing: 0.5, marginTop: icon ? 16 : 0 }]}>
            {eyebrow}
          </Text>
        ) : null}

        <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: eyebrow ? 6 : icon ? 16 : 0 }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 8 }]}>{subtitle}</Text>
        ) : null}

        {children ? <View style={{ marginTop: 24 }}>{children}</View> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: t.spacing.md }]}>
        <Button label={primaryLabel} onPress={onPrimaryPress} disabled={primaryDisabled} loading={primaryLoading} />
        {secondaryLabel ? (
          <Button label={secondaryLabel} onPress={onSecondaryPress} variant="tertiary" style={{ marginTop: 4 }} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingTop: 4 },
  scrollContent: { flexGrow: 1, paddingTop: 20, justifyContent: 'center' },
  iconChip: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: 8, paddingBottom: 12 },
});
