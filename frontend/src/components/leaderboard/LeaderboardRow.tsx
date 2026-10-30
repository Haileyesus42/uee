import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar } from '../common/Avatar';
import { LeaderboardEntry } from '../../data/leaderboard';

export function LeaderboardRow({
  entry,
  isLast = false,
}: {
  entry: LeaderboardEntry;
  isLast?: boolean;
}) {
  const t = useTheme();
  const accent = entry.isCurrentUser ? t.colors.brand : t.colors.textPrimary;
  const muted = entry.isCurrentUser ? t.colors.brand : t.colors.textSecondary;

  return (
    <View
      style={[
        styles.row,
        entry.isCurrentUser && { backgroundColor: t.colors.brandLight },
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.colors.border,
        },
      ]}
    >
      <Text style={[styles.rankCell, { color: muted }]}>{entry.rank}</Text>
      <Avatar
        userId={entry.userId}
        hasPhoto={entry.hasAvatarPhoto}
        emoji={entry.avatarEmoji}
        size={28}
      />
      <View style={styles.nameCol}>
        <Text style={[t.typography.bodyStrong, { color: accent }]} numberOfLines={1}>
          {entry.name}
          {entry.isCurrentUser ? ' · You' : ''}
        </Text>
        {entry.grade != null && (
          <Text style={[styles.gradeLine, { color: t.colors.textSecondary }]}>
            Grade {entry.grade}
          </Text>
        )}
      </View>
      <Text style={[styles.xpCell, { color: accent }]}>{entry.xp.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  rankCell: {
    width: 28,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
  },
  nameCol: { flex: 1, marginLeft: 10, marginRight: 8 },
  gradeLine: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 1 },
  xpCell: {
    minWidth: 50,
    textAlign: 'right',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    fontWeight: '600',
  },
});