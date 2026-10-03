import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { AppTopBar } from '../../components/navigation/AppTopBar';
import { TopBarActions } from '../../components/navigation/TopBarActions';
import { useUeeStreams } from '../../hooks/useUee';
import { UeeStreamId } from '../../api/types';
import { UeeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<UeeStackParamList, 'StreamSelect'>,
  BottomTabScreenProps<MainTabParamList>
>;

const STREAM_META: Record<UeeStreamId, { icon: keyof typeof Ionicons.glyphMap; blurb: string }> = {
  natural: { icon: 'flask-outline', blurb: 'Biology, Chemistry, Physics, Mathematics, English, Civics, Aptitude' },
  social: { icon: 'earth-outline', blurb: 'History, Geography, Economics, Mathematics, English, Civics, Aptitude' },
};

export function StreamSelectScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: streams } = useUeeStreams();
  if (!streams) return null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <AppTopBar
          title="UEE"
          icon="document-text-outline"
          right={
            <TopBarActions
              onPressPro={() => navigation.navigate('Profile', { screen: 'Premium' })}
              onPressProfile={() => navigation.navigate('Profile', { screen: 'ProfileHome' })}
            />
          }
        />
      </View>

      <View style={{ padding: t.spacing.md, flex: 1, justifyContent: 'center' }}>
        <Text style={[t.typography.h2, { color: t.colors.textPrimary, marginBottom: 6 }]}>Which stream are you in?</Text>
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 24 }]}>
          Past papers and mock exams are different for each stream.
        </Text>

        {streams.map((stream) => {
          const meta = STREAM_META[stream.id];
          return (
            <Pressable
              key={stream.id}
              onPress={() => navigation.navigate('UeeHome', { stream: stream.id })}
              style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow.card]}
            >
              <View style={[styles.iconChip, { backgroundColor: t.colors.brandLight }]}>
                <Ionicons name={meta.icon} size={26} color={t.colors.brand} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{stream.label}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>{meta.blurb}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 14,
  },
  iconChip: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
