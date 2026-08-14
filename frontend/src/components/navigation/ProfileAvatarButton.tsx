import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Same gradient/emoji identity as the avatar on Home and Profile, sized down
// to sit inline in an AppTopBar's `right` slot.
export function ProfileAvatarButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <LinearGradient
        colors={['#cbb7f5', '#8f6fe0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.avatar}
      >
        <Text style={styles.avatarEmoji}>👩🏾‍🎓</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 20 },
});
