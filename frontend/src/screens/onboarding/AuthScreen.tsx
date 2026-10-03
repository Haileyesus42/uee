import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/buttons/Button';
import { OnboardingStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthProvider';
import { ApiError } from '../../api/client';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Auth'>;

// Telegram brand blue — fixed regardless of theme, same as the exam-hero gradient
// elsewhere: this is Telegram's own identity, not ours to retheme.
const TELEGRAM_BLUE = '#229ED9';

type Phase = 'idle' | 'waiting' | 'error';

export function AuthScreen({ navigation }: Props) {
  const t = useTheme();
  const { beginTelegramLogin, pollTelegramLogin, cancelTelegramLogin } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const pendingLink = useRef<{ loginToken: string; deepLink: string } | null>(null);

  useEffect(() => {
    // Stop polling if the user backs out of this screen mid-attempt.
    return () => cancelTelegramLogin();
  }, [cancelTelegramLogin]);

  async function startLogin() {
    setError(null);
    setPhase('waiting');

    // Neither of these two calls actually reaches Telegram — /auth/telegram/start
    // and the status poll are both purely local (a Redis token + a read), so a
    // failure here means our own server is unreachable, not Telegram. Only
    // Linking.openURL genuinely leaves the app. Distinguishing them so the error
    // shown actually points at what broke, instead of one generic "check your
    // connection" that blamed Telegram for a backend hiccup.
    let link: { loginToken: string; deepLink: string };
    try {
      link = await beginTelegramLogin();
      pendingLink.current = link;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server — check your connection.");
      setPhase('error');
      return;
    }

    try {
      await Linking.openURL(link.deepLink);
    } catch {
      setError("Couldn't open Telegram — make sure it's installed.");
      setPhase('error');
      return;
    }

    try {
      const confirmed = await pollTelegramLogin(link.loginToken);
      if (!confirmed) {
        setError("Didn't get a confirmation in time — try again.");
        setPhase('error');
      }
      // On success the app switches screens automatically once useAuth()'s status
      // flips to 'signedIn' — nothing else to do here.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server — check your connection.");
      setPhase('error');
    }
  }

  function reopenTelegram() {
    if (pendingLink.current) Linking.openURL(pendingLink.current.deepLink);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar onBack={() => navigation.goBack()} />
      </View>

      <View style={[styles.content, { paddingHorizontal: t.spacing.md }]}>
        <View style={[styles.badge, { backgroundColor: TELEGRAM_BLUE }]}>
          <Ionicons name="paper-plane" size={30} color="#FFFFFF" />
        </View>

        <Text style={[t.typography.h1, { color: t.colors.textPrimary, marginTop: 20, textAlign: 'center' }]}>
          Continue with Telegram
        </Text>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
          {phase === 'waiting'
            ? 'Tap Start in Telegram to confirm — this screen will move on automatically.'
            : "We'll open Telegram so you can confirm it's you. No password, no code to type."}
        </Text>

        {phase === 'waiting' && (
          <View style={styles.waitingRow}>
            <ActivityIndicator color={t.colors.brand} />
            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8 }]}>
              Waiting for confirmation…
            </Text>
          </View>
        )}
        {error && (
          <Text style={[t.typography.caption, { color: t.colors.error, marginTop: 16, textAlign: 'center' }]}>
            {error}
          </Text>
        )}
      </View>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        {phase === 'waiting' ? (
          <Button label="Reopen Telegram" onPress={reopenTelegram} variant="secondary" />
        ) : (
          <Button label={phase === 'error' ? 'Try Again' : 'Continue with Telegram'} onPress={startLogin} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  waitingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
});
