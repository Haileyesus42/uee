import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProBadgeButton } from './ProBadgeButton';
import { ProfileAvatarButton } from './ProfileAvatarButton';

// Bundles the two things every tab-root AppTopBar's `right` slot needs, so
// the four screens that use it don't each repeat the same row.
export function TopBarActions({
  onPressPro,
  onPressProfile,
}: {
  onPressPro?: () => void;
  onPressProfile?: () => void;
}) {
  return (
    <View style={styles.row}>
      <ProBadgeButton onPress={onPressPro} />
      <ProfileAvatarButton onPress={onPressProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
