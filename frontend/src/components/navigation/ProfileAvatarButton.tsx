import React from 'react';
import { Pressable } from 'react-native';
import { Avatar } from '../common/Avatar';
import { useMe } from '../../hooks/useProfile';

export function ProfileAvatarButton({ onPress }: { onPress?: () => void }) {
  const { data: profile } = useMe();

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Avatar
        userId={profile?.id ?? ''}
        hasPhoto={profile?.hasAvatarPhoto ?? false}
        emoji={profile?.avatarEmoji ?? '🧑🎓'}
        size={40}
      />
    </Pressable>
  );
}
