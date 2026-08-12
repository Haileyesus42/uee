import React, { useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PhoneFlowLayout } from '../../components/onboarding/PhoneFlowLayout';
import { useTheme } from '../../theme/ThemeProvider';
import { OnboardingStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthProvider';
import { ApiError } from '../../api/client';
import { requestOtp } from '../../api/auth';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OtpVerification'>;

const CODE_LENGTH = 4;
const RESEND_COOLDOWN = 30;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { verifyOtp } = useAuth();
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const verifyStarted = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  // Guards with a ref (not the `verified` state) so setting `verified` below
  // doesn't itself change this effect's dependencies and re-trigger it — that
  // would run this effect's own cleanup and cancel the pending verify call
  // before it ever resolves.
  useEffect(() => {
    if (code.length !== CODE_LENGTH || verifyStarted.current) return;
    verifyStarted.current = true;
    setError(null);
    setVerifying(true);

    verifyOtp(phone, code)
      .then(() => setVerified(true))
      // RootNavigator switches to the main app the instant verifyOtp() sets a
      // session — no explicit navigation call needed here on success.
      .catch((err) => {
        verifyStarted.current = false;
        setCode('');
        setError(err instanceof ApiError ? err.message : 'Could not verify — check your connection.');
      })
      .finally(() => setVerifying(false));
  }, [code, phone, verifyOtp]);

  function handleChangeCode(v: string) {
    setCode(v.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH));
  }

  async function handleResend() {
    verifyStarted.current = false;
    setCode('');
    setVerified(false);
    setVerifying(false);
    setError(null);
    setSecondsLeft(RESEND_COOLDOWN);
    try {
      await requestOtp(phone);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend — check your connection.');
    }
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
                borderColor: verified
                  ? t.colors.success
                  : error
                    ? t.colors.error
                    : code.length === i
                      ? t.colors.brand
                      : t.colors.border,
                backgroundColor: verified ? t.colors.successLight : error ? t.colors.errorLight : t.colors.surface,
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
        ) : verifying ? (
          <>
            <ActivityIndicator size="small" color={t.colors.brand} />
            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 8 }]}>Verifying…</Text>
          </>
        ) : error ? (
          <Text style={[t.typography.caption, { color: t.colors.error }]}>{error}</Text>
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
