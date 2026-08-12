import React, { useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PhoneFlowLayout } from '../../components/onboarding/PhoneFlowLayout';
import { useTheme } from '../../theme/ThemeProvider';
import { OnboardingStackParamList } from '../../navigation/types';
import { useOnboardingFlow } from '../../navigation/OnboardingFlowContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OtpVerification'>;

const CODE_LENGTH = 4;
const DEMO_CODE = '1234';
const AUTO_ARRIVE_MS = 1400;
const RESEND_COOLDOWN = 30;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { complete } = useOnboardingFlow();
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const autoFillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyStarted = useRef(false);

  function scheduleAutoFill() {
    if (autoFillTimer.current) clearTimeout(autoFillTimer.current);
    autoFillTimer.current = setTimeout(() => setCode(DEMO_CODE), AUTO_ARRIVE_MS);
  }

  // Simulates the code "arriving" via SMS autofill — a real device would
  // hook into the OS's SMS OTP autofill (textContentType="oneTimeCode");
  // there's no backend here to actually send one.
  useEffect(() => {
    scheduleAutoFill();
    return () => {
      if (autoFillTimer.current) clearTimeout(autoFillTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  // Guards with a ref (not the `verified` state) so setting `verified` below
  // doesn't itself change this effect's dependencies and re-trigger it — that
  // would run this effect's own cleanup and cancel the pending `complete()`
  // timeout before it ever fires.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !verifyStarted.current) {
      verifyStarted.current = true;
      setVerified(true);
      const proceed = setTimeout(() => complete(), 500);
      return () => clearTimeout(proceed);
    }
  }, [code, complete]);

  function handleChangeCode(v: string) {
    if (autoFillTimer.current) {
      clearTimeout(autoFillTimer.current);
      autoFillTimer.current = null;
    }
    setCode(v.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH));
  }

  function handleResend() {
    verifyStarted.current = false;
    setCode('');
    setVerified(false);
    setSecondsLeft(RESEND_COOLDOWN);
    scheduleAutoFill();
  }

  return (
    <PhoneFlowLayout
      onBack={() => navigation.goBack()}
      title="Enter Code"
      subtitle={
        <Text>
          {`We've sent an SMS with a code to ${phone}. `}
          <Text
            onPress={() => navigation.goBack()}
            style={{ color: t.colors.brand, fontFamily: 'Inter_600SemiBold' }}
          >
            Edit
          </Text>
        </Text>
      }
    >
      <View style={styles.row}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.box,
              {
                borderColor: verified ? t.colors.success : code.length === i ? t.colors.brand : t.colors.border,
                backgroundColor: verified ? t.colors.successLight : t.colors.surface,
                borderRadius: t.radius.md,
              },
            ]}
          >
            <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{code[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        value={code}
        onChangeText={handleChangeCode}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus
      />

      <View style={styles.statusRow}>
        {verified ? (
          <>
            <ActivityIndicator size="small" color={t.colors.success} />
            <Text style={[t.typography.caption, { color: t.colors.success, marginLeft: 8 }]}>
              Verified — continuing…
            </Text>
          </>
        ) : secondsLeft > 0 ? (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
            Resend code in 0:{secondsLeft.toString().padStart(2, '0')}
          </Text>
        ) : (
          <Pressable onPress={handleResend}>
            <Text style={[t.typography.bodyStrong, { color: t.colors.brand, fontSize: 13 }]}>
              Didn't get the code? Resend
            </Text>
          </Pressable>
        )}
      </View>
    </PhoneFlowLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  box: { width: 48, height: 52, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
});
