import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Motivation } from '../../hooks/useMotivation';

export function MotivationBanner({
  motivation,
  onDismiss,
}: {
  motivation: Motivation;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);

  function handleDismiss() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setHidden(true);
      onDismiss();
    });
  }

  if (hidden) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: t.colors.surface,
            borderColor: t.colors.border,
          },
        ]}
      >
        <View style={[styles.emojiWrap, { backgroundColor: t.colors.brandLight }]}>
          <Text style={styles.emoji}>{motivation.emoji}</Text>
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: t.colors.brand }]}>{motivation.title}</Text>
          <Text style={[styles.message, { color: t.colors.textSecondary }]}>
            {motivation.message}
          </Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          hitSlop={10}
          style={[styles.dismiss, { backgroundColor: t.colors.surfaceAlt }]}
        >
          <Ionicons name="close" size={14} color={t.colors.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  emoji: { fontSize: 18 },
  body: { flex: 1, marginLeft: 11, marginRight: 6 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 12, fontWeight: '700' as const },
  message: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 2 },
  dismiss: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});