import React, { useState } from 'react';
import { Image, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
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
  dot,
  onDotPress,
}: {
  userId: string;
  hasPhoto: boolean;
  emoji: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  // Small unread-style indicator in the corner (see HomeScreen's top bar,
  // which uses this instead of a separate bell button). onDotPress gets its
  // own small Pressable with generous hitSlop so it's a real tap target
  // despite the dot itself being tiny — the rest of the avatar keeps
  // whatever onPress its wrapping Pressable already has, unchanged.
  dot?: boolean;
  onDotPress?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const radius = size / 2;
  const dotSize = Math.max(14, Math.round(size * 0.4));
  // Centers the dot ON the circle's upper-right edge (the 45° point) rather
  // than floating in the bounding box's corner, which sits outside the circle
  // entirely — this is what actually makes it read as overlapping the avatar.
  const edge = radius * Math.SQRT1_2; // cos45 == sin45 == 1/sqrt(2)
  const dotCenterX = radius + edge;
  const dotCenterY = radius - edge;

  const content =
    hasPhoto && !failed ? (
      <Image
        source={{ uri: `${API_URL}/avatars/${userId}` }}
        onError={() => setFailed(true)}
        // ViewStyle and ImageStyle overlap almost entirely (width/height/borderRadius/
        // margin/etc.) but TS keeps them nominally distinct — callers only ever pass
        // plain layout styles here, so this cast is safe.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={[{ width: size, height: size, borderRadius: radius }, style] as any}
      />
    ) : (
      <LinearGradient
        colors={['#cbb7f5', '#8f6fe0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }, style]}
      >
        <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      </LinearGradient>
    );

  if (!dot) return content;

  const dotNode = (
    <View
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: '#E5484D',
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }}
    />
  );
  const dotPosition = { position: 'absolute' as const, top: dotCenterY - dotSize / 2, left: dotCenterX - dotSize / 2 };

  return (
    <View style={{ width: size, height: size }}>
      {content}
      {onDotPress ? (
        <Pressable onPress={onDotPress} hitSlop={10} style={dotPosition}>
          {dotNode}
        </Pressable>
      ) : (
        <View style={dotPosition}>{dotNode}</View>
      )}
    </View>
  );
}
