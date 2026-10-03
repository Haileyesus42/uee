import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { GradientButton } from '../../components/buttons/GradientButton';
import { useLatestTelebirrSubmission, useSubmitTelebirrPayment, useTelebirrInfo } from '../../hooks/useBilling';
import { ApiError } from '../../api/client';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'TelebirrPayment'>;
type PickedImage = { uri: string; mimeType: string };

// Telebirr has no documented deep-link scheme for pre-filling a send-money
// screen (recipient/amount) for a peer-to-peer transfer — that only exists for
// its formal merchant "Fabric Payment Gateway" API (a redirect-based checkout
// requiring registered merchant credentials, a different integration entirely
// from this manual-screenshot flow). This just launches the app itself, saving
// a "find and open Telebirr" step — the user still enters the number manually
// once inside. Package id per public APK listings, not an official source;
// worst case it's wrong and the Play Store fallback below still works.
const TELEBIRR_PACKAGE = 'cn.tydic.ethiopay';

async function openTelebirrApp() {
  try {
    await Linking.openURL(`android-app://${TELEBIRR_PACKAGE}`);
  } catch {
    // Not installed, or nothing handled the intent — send them to install it
    // instead of failing silently.
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${TELEBIRR_PACKAGE}`).catch(() => {});
  }
}

export function TelebirrPaymentScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { plan } = route.params;
  const { data: info, isLoading: infoLoading } = useTelebirrInfo();
  const { data: latestData, isLoading: latestLoading } = useLatestTelebirrSubmission();
  const submitMutation = useSubmitTelebirrPayment();
  const [picked, setPicked] = useState<PickedImage | null>(null);

  const latest = latestData?.submission ?? null;
  const awaitingReview = latest?.status === 'needs_review';

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload your payment screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPicked({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  }

  function submit() {
    if (!picked) return;
    submitMutation.mutate(
      { plan, screenshot: picked },
      {
        onSuccess: (result) => {
          setPicked(null);
          if (result.status === 'rejected') {
            Alert.alert('Not approved', result.reviewNote ?? 'This payment could not be verified.');
          }
        },
        onError: (err) => {
          Alert.alert('Upload failed', err instanceof ApiError ? err.message : 'Please try again.');
        },
      }
    );
  }

  async function copyPhone(phone: string) {
    await Clipboard.setStringAsync(phone);
    Alert.alert('Copied', 'Phone number copied to clipboard.');
  }

  if (infoLoading || latestLoading) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: t.colors.bg }]}>
        <ActivityIndicator color={t.colors.brand} />
      </SafeAreaView>
    );
  }

  if (!info?.enabled) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
        <View style={{ paddingHorizontal: t.spacing.md }}>
          <TopBar title="Pay with Telebirr" onBack={() => navigation.goBack()} />
        </View>
        <View style={[styles.flex, styles.center, { padding: t.spacing.lg }]}>
          <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            Telebirr payment isn't set up yet — please check back shortly or contact support.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const priceETB = info.priceETB[plan];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Pay with Telebirr" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        {latest?.status === 'approved' ? (
          <View style={[styles.card, { backgroundColor: t.colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={28} color={t.colors.success} />
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 8 }]}>
              You're Pro! Your Telebirr payment was confirmed.
            </Text>
            <GradientButton label="Back to Premium" onPress={() => navigation.goBack()} style={{ marginTop: 14 }} />
          </View>
        ) : awaitingReview ? (
          <View style={[styles.card, { backgroundColor: t.colors.warningLight }]}>
            <Ionicons name="time-outline" size={28} color={t.colors.warning} />
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 8 }]}>
              We're reviewing your payment
            </Text>
            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 4 }]}>
              This usually takes a few minutes. This screen updates automatically — no need to resubmit.
            </Text>
          </View>
        ) : (
          <>
            {latest?.status === 'rejected' ? (
              <View style={[styles.card, { backgroundColor: t.colors.errorLight, marginBottom: t.spacing.md }]}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.error }]}>Last attempt wasn't approved</Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 4 }]}>
                  {latest.reviewNote ?? 'The payment could not be verified.'}
                </Text>
              </View>
            ) : null}

            <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1 }]}>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>STEP 1 — SEND PAYMENT</Text>
              <Text style={[t.typography.h2, { color: t.colors.textPrimary, marginTop: 6 }]}>{priceETB} ETB</Text>
              <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 10 }]}>
                Send this amount via Telebirr to:
              </Text>

              <Pressable
                onPress={() => copyPhone(info.receiverPhone)}
                style={[styles.phoneRow, { backgroundColor: t.colors.brandLight }]}
              >
                <View>
                  <Text style={[t.typography.h3, { color: t.colors.brand }]}>{info.receiverPhone}</Text>
                  {info.receiverName ? (
                    <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{info.receiverName}</Text>
                  ) : null}
                </View>
                <Ionicons name="copy-outline" size={20} color={t.colors.brand} />
              </Pressable>

              {Platform.OS === 'android' ? (
                <Pressable onPress={openTelebirrApp} style={styles.openAppRow}>
                  <Ionicons name="open-outline" size={15} color={t.colors.textSecondary} />
                  <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginLeft: 6 }]}>
                    Open Telebirr app
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1, marginTop: t.spacing.md }]}>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>STEP 2 — UPLOAD CONFIRMATION</Text>
              <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 6 }]}>
                Upload a screenshot of the Telebirr confirmation message or receipt.
              </Text>

              {picked ? (
                <Image source={{ uri: picked.uri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <Pressable
                  onPress={pickImage}
                  style={[styles.uploadBox, { borderColor: t.colors.border, backgroundColor: t.colors.bg }]}
                >
                  <Ionicons name="image-outline" size={26} color={t.colors.textSecondary} />
                  <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 6 }]}>
                    Tap to choose a screenshot
                  </Text>
                </Pressable>
              )}

              {picked ? (
                <Pressable onPress={pickImage} style={{ marginTop: 10 }}>
                  <Text style={[t.typography.caption, { color: t.colors.brand }]}>Choose a different screenshot</Text>
                </Pressable>
              ) : null}
            </View>

            <GradientButton
              label={submitMutation.isPending ? 'Submitting…' : 'Submit payment'}
              onPress={submit}
              style={{ marginTop: t.spacing.lg, opacity: picked && !submitMutation.isPending ? 1 : 0.5 }}
            />
            <Text style={[styles.footNote, { color: t.colors.textSecondary }]}>
              Approved automatically in most cases — occasionally reviewed by hand.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, padding: 16 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  uploadBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 28,
    alignItems: 'center',
  },
  preview: { width: '100%', height: 180, borderRadius: 12, marginTop: 12 },
  openAppRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, padding: 4 },
  footNote: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 10.5, marginTop: 8 },
});
