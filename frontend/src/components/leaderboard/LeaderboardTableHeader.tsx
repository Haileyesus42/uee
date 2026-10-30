import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function LeaderboardTableHeader() {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.colors.border }]}>
      <Text style={[styles.rankCell, styles.caps, { color: t.colors.textSecondary }]}>#</Text>
      {/* Avatar spacer — mirrors the 28dp avatar in each data row so the
          STUDENT label lines up with the names below. */}
      <View style={styles.avatarSpacer} />
      <View style={styles.nameCol}>
        <Text style={[styles.caps, { color: t.colors.textSecondary }]}>STUDENT</Text>
      </View>
      <Text style={[styles.xpCell, styles.caps, { color: t.colors.textSecondary, textAlign: 'right' }]}>
        XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankCell: { width: 28, textAlign: 'center' },
  avatarSpacer: { width: 28 },
  nameCol: { flex: 1, marginLeft: 10, marginRight: 8 },
  xpCell: { minWidth: 50 },
  caps: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});