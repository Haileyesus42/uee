import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { JourneyRow, JourneyItem } from '../progress/JourneyRow';

export function UnitPath({
  title,
  grade,
  lessons,
  onPressHeader,
  onPressLesson,
}: {
  title: string;
  grade?: number;
  lessons: JourneyItem[];
  onPressHeader?: () => void;
  onPressLesson?: (index: number) => void;
}) {
  const t = useTheme();

  return (
    <View>
      <Pressable onPress={onPressHeader} style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{title}</Text>
          {grade != null && (
            <View style={[styles.gradeBadge, { backgroundColor: t.colors.brandLight }]}>
              <Text style={[styles.gradeBadgeText, { color: t.colors.brand }]}>G{grade}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} />
      </Pressable>

      <View style={{ marginTop: 14 }}>
        {lessons.map((lesson, i) => (
          <JourneyRow
            key={lesson.label}
            item={lesson}
            isLast={i === lessons.length - 1}
            onPress={() => onPressLesson?.(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradeBadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999 },
  gradeBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, fontWeight: '700' },
});
