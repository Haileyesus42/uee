import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar } from '../common/Avatar';
import { LeaderboardEntry } from '../../data/leaderboard';

export function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: entry.isCurrentUser ? t.colors.brandLight : t.colors.surface },
        t.shadow.card,
      ]}
    >
      <Text
        style={[
          t.typography.bodyStrong,
          { color: entry.isCurrentUser ? t.colors.brand : t.colors.textSecondary, width: 22 },
        ]}
      >
        {entry.rank}
      </Text>
      <Avatar userId={entry.userId} hasPhoto={entry.hasAvatarPhoto} emoji={entry.avatarEmoji} size={32} />
      <Text
        style={[
          t.typography.bodyStrong,
          { color: entry.isCurrentUser ? t.colors.brand : t.colors.textPrimary, flex: 1, marginLeft: 10 },
        ]}
        numberOfLines={1}
      >
        {entry.name}
        {entry.isCurrentUser ? ' · You' : ''}
      </Text>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{entry.xp.toLocaleString()} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 10, marginBottom: 8 },
});
