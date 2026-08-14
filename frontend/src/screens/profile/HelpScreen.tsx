import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/cards/Card';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Help'>;

const FAQS = [
  {
    q: 'How is my UEE Readiness calculated?',
    a: 'It combines your practice accuracy, mastery across subjects, and mock exam performance into a single internal indicator — not a guaranteed prediction of your real score.',
  },
  {
    q: 'Where do the historical exam questions come from?',
    a: "We're building a 20+ year archive of real past UEE questions. Content is added and verified over time.",
  },
  {
    q: 'How does the streak work?',
    a: 'Complete at least one lesson or practice session each day to keep your streak going.',
  },
  {
    q: 'Can I change my target subjects later?',
    a: 'Yes — go to Settings → Edit Profile to update your grade, subjects, and target score at any time.',
  },
];

export function HelpScreen({ navigation }: Props) {
  const t = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Help & Support" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary, letterSpacing: 0.5, marginBottom: 12 }]}>
          FREQUENTLY ASKED QUESTIONS
        </Text>

        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <Pressable key={faq.q} onPress={() => setOpenIndex(open ? null : i)}>
              <Card style={styles.faqCard}>
                <View style={styles.faqHeader}>
                  <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, flex: 1 }]}>{faq.q}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={t.colors.textSecondary}
                  />
                </View>
                {open && (
                  <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 8 }]}>{faq.a}</Text>
                )}
              </Card>
            </Pressable>
          );
        })}

        <Text
          style={[t.typography.caption, { color: t.colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 12 }]}
        >
          CONTACT US
        </Text>
        <Card style={styles.contactRow}>
          <Ionicons name="mail-outline" size={19} color={t.colors.brand} />
          <Text style={[t.typography.body, { color: t.colors.textPrimary, marginLeft: 12 }]}>
            support@compassapp.com
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  faqCard: { marginBottom: 10 },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
});
