import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { JourneyRow, JourneyItem } from '../progress/JourneyRow';

export type { JourneyItem, JourneyStatus } from '../progress/JourneyRow';

export function LearningJourney({
  subject,
  items,
  onPress,
}: {
  subject: string;
  items: JourneyItem[];
  onPress?: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable onPress={onPress}>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary, letterSpacing: 0.5 }]}>
        YOUR LEARNING JOURNEY
      </Text>
      <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginTop: 4 }]}>{subject}</Text>

      <View style={{ marginTop: 16 }}>
        {items.map((item, i) => (
          <JourneyRow key={item.label} item={item} isLast={i === items.length - 1} />
        ))}
      </View>
    </Pressable>
  );
}
