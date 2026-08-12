import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export function ChoiceCard({
  label,
  description,
  selected,
  multiSelect,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  multiSelect?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
      accessibilityState={{ selected }}
      style={[
        styles.row,
        {
          borderColor: selected ? t.colors.brand : t.colors.border,
          backgroundColor: selected ? t.colors.brandLight : t.colors.surface,
          borderRadius: t.radius.md,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>{label}</Text>
        {description ? (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>{description}</Text>
        ) : null}
      </View>

      <View
        style={[
          multiSelect ? styles.checkbox : styles.radio,
          {
            borderColor: selected ? t.colors.brand : t.colors.border,
            backgroundColor: selected ? t.colors.brand : 'transparent',
          },
        ]}
      >
        {selected && <Ionicons name="checkmark" size={13} color={t.colors.textInverse} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
