import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../cards/Card';
import { GradientButton } from '../buttons/GradientButton';

export function ContinueLearningCard({
  subject,
  lessonTitle,
  lessonPosition,
  lessonCount,
  progress,
  onPress,
}: {
  subject: string;
  lessonTitle: string;
  lessonPosition: number;
  lessonCount: number;
  progress: number;
  onPress?: () => void;
}) {
  const t = useTheme();

  return (
    <View>
      <Text style={[styles.sectionLabel, { color: t.colors.brand }]}>Continue Learning</Text>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.thumbWrap}>
            <LinearGradient
              colors={['#7b4ff0', '#4e2bc6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.thumb}
            >
              <Text style={styles.thumbText}>x²+bx+c=0</Text>
            </LinearGradient>
            <Text style={styles.pencil}>✏️</Text>
          </View>

          <Pressable onPress={onPress} style={styles.info}>
            <Text style={[styles.title, { color: t.colors.textPrimary }]} numberOfLines={1}>
              {lessonTitle}
            </Text>
            <Text style={[styles.meta, { color: t.colors.textSecondary }]} numberOfLines={1}>
              Lesson {lessonPosition} of {lessonCount}
            </Text>
            <View style={styles.progressLine}>
              <View style={[styles.track, { backgroundColor: t.colors.track }]}>
                <LinearGradient
                  colors={['#8a63ff', '#6a3ff0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]}
                />
              </View>
              <Text style={[styles.pct, { color: t.colors.textPrimary }]}>{Math.round(progress * 100)}%</Text>
            </View>
          </Pressable>

          <GradientButton
            label="Continue →"
            onPress={onPress}
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontFamily: 'Manrope_700Bold', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumbWrap: { width: 50, height: 50 },
  thumb: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 3 },
  thumbText: { color: '#e6dcff', fontSize: 7.5, fontWeight: '600', textAlign: 'center' },
  pencil: { position: 'absolute', right: -5, bottom: -5, fontSize: 14, transform: [{ rotate: '8deg' }] },
  info: { flex: 1, marginLeft: 10, marginRight: 8 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 13, fontWeight: '800' },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3, marginBottom: 6 },
  progressLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 5, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  pct: { fontFamily: 'Inter_700Bold', fontSize: 10, fontWeight: '700' },
  continueButton: { paddingVertical: 8, paddingHorizontal: 11 },
  continueButtonText: { fontSize: 10.5 },
});
