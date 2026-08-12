import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { LeaderboardEntry } from '../../data/leaderboard';

// Medal colors are a fixed gold/silver/bronze identity, not theme tokens —
// they should read the same in light and dark mode.
const MEDAL_COLORS = ['#F0B23C', '#B7BAC6', '#CB8A54'];
const PILLAR_HEIGHTS = [72, 96, 56]; // 2nd, 1st, 3rd

export function LeaderboardPodium({ top3 }: { top3: LeaderboardEntry[] }) {
  const [first, second, third] = top3;
  return (
    <View style={styles.row}>
      <PodiumColumn entry={second} place={2} pillarHeight={PILLAR_HEIGHTS[0]} />
      <PodiumColumn entry={first} place={1} pillarHeight={PILLAR_HEIGHTS[1]} crown />
      <PodiumColumn entry={third} place={3} pillarHeight={PILLAR_HEIGHTS[2]} />
    </View>
  );
}

function PodiumColumn({
  entry,
  place,
  pillarHeight,
  crown,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
  pillarHeight: number;
  crown?: boolean;
}) {
  const t = useTheme();
  const color = MEDAL_COLORS[place - 1];
  const avatarSize = place === 1 ? 58 : 48;

  return (
    <View style={styles.col}>
      <View style={styles.crownSlot}>
        {crown && <Ionicons name="trophy" size={20} color={color} />}
      </View>
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: t.colors.surface,
            borderColor: color,
          },
        ]}
      >
        <Text style={{ fontSize: avatarSize * 0.46 }}>{entry.avatarEmoji}</Text>
      </View>
      <Text
        style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 8, fontSize: 12 }]}
        numberOfLines={1}
      >
        {entry.name}
      </Text>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary, fontSize: 10 }]}>
        {entry.xp.toLocaleString()} XP
      </Text>
      <View style={[styles.pillar, { height: pillarHeight, backgroundColor: color }]}>
        <Text style={styles.pillarText}>{place}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginTop: 10 },
  col: { alignItems: 'center', width: 92 },
  crownSlot: { height: 22, justifyContent: 'flex-end' },
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  pillar: { width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 10, alignItems: 'center', paddingTop: 6 },
  pillarText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
});
