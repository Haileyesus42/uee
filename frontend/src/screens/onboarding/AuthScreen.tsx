import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, StyleSheet, Text, View } from 'react-native';
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

// Retry poll across multiple attempts — one internal poll may return false on
// timeout before the user finishes in Telegram. 5 retries at the default
// internal timeout gives roughly a 5-minute total window.
const POLL_RETRIES = 5;

export function AuthScreen({ navigation }: Props) {
  const t = useTheme();
  const { beginTelegramLogin, pollTelegramLogin, cancelTelegramLogin } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const pendingLink = useRef<{ loginToken: string; deepLink: string } | null>(null);
  // True only while a login attempt is active. The AppState listener below
  // uses this to decide whether a resume-from-background should fire a fresh
  // poll (coming back from Telegram) or do nothing (idle screen).
  const pollingActive = useRef(false);

  // Stop polling if the user backs out of this screen mid-attempt.
  useEffect(() => {
    return () => {
      pollingActive.current = false;
      cancelTelegramLogin();
    };
  }, [cancelTelegramLogin]);

  // The core fix for "doesn't pick up the session after returning from Telegram":
  // when the app comes back to the foreground, immediately fire one more poll.
  // Without this, if the previous poll already returned false on timeout, the
  // user is stuck on the error screen even though Telegram has verified them.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pollingActive.current && pendingLink.current) {
        pollTelegramLogin(pendingLink.current.loginToken).catch(() => {
          // Swallow — the main retry loop in startLogin() is still active and
          // will surface any error through its own handler.
        });
      }
    });
    return () => sub.remove();
  }, [pollTelegramLogin]);

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
      pollingActive.current = true;
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
      pollingActive.current = false;
      return;
    }

    // Retry loop: a single pollTelegramLogin() call may return false on its
    // own internal timeout before the user has tapped Start in Telegram. Loop
    // a few times to give them a proper window. The AppState listener above
    // also fires an extra poll each time they return to the app — belt and
    // suspenders for the same problem.
    for (let attempt = 0; attempt < POLL_RETRIES; attempt++) {
      try {
        const confirmed = await pollTelegramLogin(link.loginToken);
        if (confirmed) {
          pollingActive.current = false;
          return; // Navigation handled by useAuth once status flips to 'signedIn'
        }
      } catch (err) {
        pollingActive.current = false;
        setError(err instanceof ApiError ? err.message : "Couldn't reach the server — check your connection.");
        setPhase('error');
        return;
      }
    }

    pollingActive.current = false;
    setError("Didn't get a confirmation — tap 'Reopen Telegram' or try again.");
    setPhase('error');
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
            ? 'Tap Start in Telegram, then switch back to this app — this screen moves on automatically.'
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