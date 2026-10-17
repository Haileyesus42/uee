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
  // Whether the small red unread-indicator circle is visually shown (see
  // HomeScreen's top bar, which uses this instead of a separate bell button).
  // onDotPress's tap target is independent of this — it still renders
  // whenever onDotPress is given, even with dot false, so "no unread
  // notifications" never removes the only way to reach that screen from here.
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

  if (!dot && !onDotPress) return content;

  const dotNode = dot ? (
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
  ) : null;
  // Explicit width/height here (not just on dotNode) so the tap target stays
  // the same dotSize×dotSize box, centered on the same spot, whether or not
  // the red circle is actually rendered inside it — a Pressable with no size
  // of its own and a null child collapses to 0×0, which quietly shifts
  // hitSlop's effective tappable area off the intended corner.
  const dotPosition = {
    position: 'absolute' as const,
    top: dotCenterY - dotSize / 2,
    left: dotCenterX - dotSize / 2,
    width: dotSize,
    height: dotSize,
  };

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
