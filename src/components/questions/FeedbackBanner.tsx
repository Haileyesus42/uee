import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useUnityChat } from '../../context/UnityChatContext';
import { Button } from '../buttons/Button';
import { RobotHead } from '../home/RobotHead';

export function FeedbackBanner({
  variant,
  title,
  message,
  primaryLabel,
  onPrimaryPress,
}: {
  variant: 'success' | 'error';
  title: string;
  message: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
}) {
  const t = useTheme();
  const { openChat } = useUnityChat();
  const isSuccess = variant === 'success';
  const bg = isSuccess ? t.colors.successLight : t.colors.errorLight;
  const accent = isSuccess ? t.colors.success : t.colors.error;

  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderRadius: t.radius.lg }]}>
      <View style={styles.headerRow}>
        <Ionicons name={isSuccess ? 'checkmark-circle' : 'close-circle'} size={20} color={accent} />
        <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginLeft: 8 }]}>{title}</Text>
      </View>
      <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 6 }]}>{message}</Text>

      {isSuccess ? (
        <View style={{ marginTop: 14 }}>
          <Button label={primaryLabel} onPress={onPrimaryPress} />
        </View>
      ) : (
        <View style={styles.actionRow}>
          <Button label={primaryLabel} onPress={onPrimaryPress} variant="secondary" size="md" fullWidth={false} />
          <Pressable
            onPress={openChat}
            hitSlop={6}
            style={[styles.askButton, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
          >
            <RobotHead size={20} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  askButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
