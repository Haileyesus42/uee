import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { PhoneFlowLayout } from '../../components/onboarding/PhoneFlowLayout';
import { AuthMethodTabs, AuthMethod } from '../../components/onboarding/AuthMethodTabs';
import { CountryPickerSheet } from '../../components/onboarding/CountryPickerSheet';
import { Country, DEFAULT_COUNTRY } from '../../data/countries';
import { OnboardingStackParamList } from '../../navigation/types';
import { useOnboardingFlow } from '../../navigation/OnboardingFlowContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Auth'>;

// Telegram brand blue — fixed regardless of theme, same as the exam-hero
// gradient elsewhere: this is Telegram's own identity, not ours to retheme.
const TELEGRAM_BLUE = '#229ED9';

export function AuthScreen({ navigation }: Props) {
  const t = useTheme();
  const { complete } = useOnboardingFlow();
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [connectingTelegram, setConnectingTelegram] = useState(false);

  const canContinuePhone = phone.length >= 7;

  // Simulates the Telegram Login Widget hand-off: Telegram itself verifies
  // the user inside its own app, so — unlike the phone path — there's no
  // separate OTP step afterward.
  function handleTelegramContinue() {
    setConnectingTelegram(true);
    setTimeout(() => complete(), 1200);
  }

  return (
    <PhoneFlowLayout
      onBack={() => navigation.goBack()}
      title="Create Your Account"
      subtitle="Choose how you'd like to sign up."
      onNext={
        method === 'phone'
          ? () => navigation.navigate('OtpVerification', { phone: `${country.dialCode} ${phone}` })
          : undefined
      }
      nextDisabled={!canContinuePhone}
    >
      <AuthMethodTabs method={method} onChange={setMethod} />

      {method === 'phone' ? (
        <View style={{ marginTop: 22 }}>
          <Pressable onPress={() => setPickerOpen(true)} style={[styles.row, { borderBottomColor: t.colors.border }]}>
            <Text style={styles.flag}>{country.flag}</Text>
            <Text style={[t.typography.body, { color: t.colors.textPrimary, flex: 1, marginLeft: 10 }]}>
              {country.name}
            </Text>
            <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>{country.dialCode}</Text>
            <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} style={{ marginLeft: 6 }} />
          </Pressable>

          <View style={[styles.row, { borderBottomColor: t.colors.border, marginTop: 2 }]}>
            <Text style={[t.typography.body, { color: t.colors.textPrimary }]}>{country.dialCode}</Text>
            <TextInput
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="Phone number"
              placeholderTextColor={t.colors.textSecondary}
              keyboardType="phone-pad"
              autoFocus
              style={[t.typography.body, styles.phoneInput, { color: t.colors.textPrimary }]}
            />
          </View>

          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 20 }]}>
            We'll text you a one-time code. Carrier charges may apply.
          </Text>

          <CountryPickerSheet
            visible={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={(c) => {
              setCountry(c);
              setPickerOpen(false);
            }}
          />
        </View>
      ) : (
        <View style={styles.telegramWrap}>
          <View style={[styles.telegramBadge, { backgroundColor: TELEGRAM_BLUE }]}>
            <Ionicons name="paper-plane" size={28} color="#FFFFFF" />
          </View>
          <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 16, textAlign: 'center' }]}>
            Verify instantly through Telegram
          </Text>
          <Text style={[styles.telegramCaption, { color: t.colors.textSecondary }]}>
            No code to type — approve the login inside Telegram and you're in.
          </Text>

          <Pressable
            onPress={handleTelegramContinue}
            disabled={connectingTelegram}
            style={[styles.telegramButton, { backgroundColor: TELEGRAM_BLUE, opacity: connectingTelegram ? 0.75 : 1 }]}
          >
            {connectingTelegram ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
                <Text style={styles.telegramButtonText}>Continue with Telegram</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </PhoneFlowLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, paddingVertical: 13 },
  flag: { fontSize: 20 },
  phoneInput: { flex: 1, marginLeft: 10, padding: 0 },
  telegramWrap: { alignItems: 'center', marginTop: 32, paddingHorizontal: 8 },
  telegramBadge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  telegramCaption: { fontSize: 12.5, lineHeight: 17, marginTop: 6, textAlign: 'center', maxWidth: 260 },
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
  },
  telegramButtonText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14.5, fontWeight: '700' },
});
