import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { useBookmarks } from '../../hooks/useTextbook';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'TextbookBookmarks'>;

export function TextbookBookmarksScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId } = route.params;
  const { data: bookmarks, toggleBookmark } = useBookmarks(subjectId);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Bookmarks" onBack={() => navigation.goBack()} />
      </View>

      <FlatList
        data={bookmarks ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}
        ListEmptyComponent={
          <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 20, textAlign: 'center' }]}>
            No bookmarks yet — tap the bookmark icon while reading to save a section.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('TextbookReader', { subjectId, sectionId: item.sectionId })}
            >
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{item.section.unitTitle}</Text>
              <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, marginTop: 2 }]} numberOfLines={1}>
                {item.section.sectionTitle}
              </Text>
            </Pressable>
            <Pressable onPress={() => toggleBookmark(item.sectionId, item.id)} hitSlop={8}>
              <Ionicons name="bookmark" size={20} color={t.colors.brand} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
});
