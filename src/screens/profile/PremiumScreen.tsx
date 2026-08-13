import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { GradientButton } from '../../components/buttons/GradientButton';
import { useCheckout, useSubscription } from '../../hooks/useBilling';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Premium'>;
type PlanId = 'monthly' | 'yearly';
type Tint = 'brand' | 'warning' | 'success' | 'secondary';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string; tint: Tint }[] = [
  { icon: 'archive-outline', label: '20+ years of past exams', tint: 'brand' },
  { icon: 'infinite-outline', label: 'Unlimited practice questions', tint: 'warning' },
  { icon: 'chatbubble-ellipses-outline', label: 'Unlimited Unity AI chats', tint: 'success' },
  { icon: 'timer-outline', label: 'Full-length mock exams', tint: 'secondary' },
  { icon: 'bar-chart-outline', label: 'Advanced analytics', tint: 'brand' },
  { icon: 'sparkles-outline', label: 'Ad-free experience', tint: 'warning' },
];

const PLANS: { id: PlanId; label: string; price: string; period: string; note?: string; badge?: string }[] = [
  { id: 'monthly', label: 'Monthly', price: '25', period: 'ETB / mo' },
  { id: 'yearly', label: 'Yearly', price: '250', period: 'ETB / yr', note: '~20.8 ETB / mo', badge: 'Save 17%' },
];

export function PremiumScreen({ navigation }: Props) {
  const t = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const { data: subscription } = useSubscription();
  const checkoutMutation = useCheckout();
  const isPro = subscription?.status === 'active';

  const tintMap: Record<Tint, { bg: string; fg: string }> = {
    brand: { bg: t.colors.brandLight, fg: t.colors.brand },
    warning: { bg: t.colors.warningLight, fg: t.colors.warning },
    success: { bg: t.colors.successLight, fg: t.colors.success },
    secondary: { bg: t.colors.secondaryLight, fg: t.colors.secondary },
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Compass Pro" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <LinearGradient colors={['#8a63ff', '#6a3ff0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={[styles.spark, { top: 10, right: 26, fontSize: 12 }]}>✦</Text>
          <Text style={[styles.spark, { top: 36, right: 48, fontSize: 8 }]}>✦</Text>
          <Text style={[styles.spark, { bottom: 16, left: 22, fontSize: 10 }]}>✦</Text>

          <View style={styles.crownBadge}>
            <Ionicons name="star" size={22} color="#D9A441" />
          </View>
          <Text style={styles.heroTitle}>Unlock Your Full{'\n'}UEE Potential</Text>
          <View style={styles.trustRow}>
            <Ionicons name="people" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.trustText}>
              {isPro && subscription?.status === 'active'
                ? `You're Pro until ${new Date(subscription.expiresAt).toLocaleDateString()}`
                : 'Built for ambitious UEE students'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.featureGrid}>
          {FEATURES.map((f) => {
            const c = tintMap[f.tint];
            return (
              <View key={f.label} style={[styles.featureCard, { backgroundColor: c.bg }]}>
                <View style={[styles.featureIcon, { backgroundColor: t.colors.surface }]}>
                  <Ionicons name={f.icon} size={15} color={c.fg} />
                </View>
                <Text style={[styles.featureLabel, { color: t.colors.textPrimary }]}>{f.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.planRow}>
          {PLANS.map((plan) => {
            const selected = plan.id === selectedPlan;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: selected ? t.colors.brandLight : t.colors.surface,
                    borderColor: selected ? t.colors.brand : t.colors.border,
                  },
                  t.shadow.card,
                ]}
              >
                {plan.badge ? (
                  <View style={styles.ribbon}>
                    <Text style={styles.ribbonText}>{plan.badge}</Text>
                  </View>
                ) : null}

                <Text
                  style={[
                    styles.planLabel,
                    { color: selected ? t.colors.brand : t.colors.textSecondary },
                  ]}
                >
                  {plan.label.toUpperCase()}
                </Text>
                <View style={styles.planPriceRow}>
                  <Text style={[t.typography.h2, { color: t.colors.textPrimary }]}>{plan.price}</Text>
                  <Text style={[styles.planPeriod, { color: t.colors.textSecondary }]}>{plan.period}</Text>
                </View>
                {plan.note ? <Text style={[styles.planNote, { color: t.colors.brand }]}>{plan.note}</Text> : null}

                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selected ? t.colors.brand : t.colors.border,
                      backgroundColor: selected ? t.colors.brand : 'transparent',
                    },
                  ]}
                >
                  {selected ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <GradientButton
          label={isPro ? "You're Pro ✓" : checkoutMutation.isPending ? 'Processing…' : 'Upgrade Now'}
          onPress={() => !isPro && checkoutMutation.mutate(selectedPlan)}
          style={{ paddingVertical: 15, opacity: isPro || checkoutMutation.isPending ? 0.7 : 1 }}
        />
        <Text style={[styles.footNote, { color: t.colors.textSecondary }]}>Cancel anytime · Secure payment</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderRadius: 18, padding: 18, alignItems: 'flex-start', overflow: 'hidden' },
  spark: { position: 'absolute', color: '#FFFFFF' },
  crownBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 12,
    lineHeight: 25,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  trustText: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_600SemiBold', fontSize: 11 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  featureCard: { width: '47.5%', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center' },
  featureIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10.5, lineHeight: 13, marginLeft: 8, flex: 1 },

  planRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  planCard: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 14, overflow: 'hidden' },
  planLabel: { fontFamily: 'Inter_700Bold', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.4 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 4 },
  planPeriod: { fontFamily: 'Inter_500Medium', fontSize: 10.5 },
  planNote: { fontFamily: 'Inter_700Bold', fontSize: 10, fontWeight: '700', marginTop: 4 },
  radio: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#D9A441',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 10,
  },
  ribbonText: { color: '#5B3B0A', fontFamily: 'Inter_700Bold', fontSize: 9, fontWeight: '700' },

  footNote: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 10.5, marginTop: 8 },
});
