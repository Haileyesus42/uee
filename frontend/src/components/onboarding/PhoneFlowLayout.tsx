import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../navigation/TopBar';

// Full-screen step layout matching Telegram/WhatsApp's phone-auth flow: a
// plain back chevron, a large left-aligned title, and — when there's a next
// step — a circular FAB in the bottom-right corner instead of a full-width
// button. No FAB at all on the OTP step, since that auto-submits.
export function PhoneFlowLayout({
  onBack,
  title,
  subtitle,
  children,
  onNext,
  nextDisabled,
  nextLoading,
}: {
  onBack?: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}) {
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar onBack={onBack} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: t.spacing.md }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[t.typography.h1, { color: t.colors.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 8 }]}>{subtitle}</Text>
          ) : null}
          <View style={{ marginTop: 28 }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>

      {onNext ? (
        <Pressable
          onPress={onNext}
          disabled={nextDisabled || nextLoading}
          style={[
            styles.fab,
            { backgroundColor: nextDisabled ? t.colors.locked : t.colors.brand },
            t.shadow.raised,
          ]}
        >
          {nextLoading ? (
            <ActivityIndicator color={t.colors.textInverse} />
          ) : (
            <Ionicons name="arrow-forward" size={22} color={t.colors.textInverse} />
          )}
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 20, paddingBottom: 100 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
