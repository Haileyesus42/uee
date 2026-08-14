import React, { useState } from 'react';
import { Image, StyleProp, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

// Centralizes the photo-vs-emoji fallback so every avatar spot (top bar, Home
// hero, Profile identity card) behaves identically — including what happens if
// the Telegram photo proxy 404s or the image otherwise fails to load: fall back
// to the emoji rather than showing a broken-image icon.
export function Avatar({
  userId,
  hasPhoto,
  emoji,
  size,
  style,
}: {
  userId: string;
  hasPhoto: boolean;
  emoji: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [failed, setFailed] = useState(false);
  const radius = size / 2;

  if (hasPhoto && !failed) {
    return (
      <Image
        source={{ uri: `${API_URL}/avatars/${userId}` }}
        onError={() => setFailed(true)}
        // ViewStyle and ImageStyle overlap almost entirely (width/height/borderRadius/
        // margin/etc.) but TS keeps them nominally distinct — callers only ever pass
        // plain layout styles here, so this cast is safe.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={[{ width: size, height: size, borderRadius: radius }, style] as any}
      />
    );
  }

  return (
    <LinearGradient
      colors={['#cbb7f5', '#8f6fe0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </LinearGradient>
  );
}
