import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { useTextbookSearch } from '../../hooks/useTextbook';
import { TextbookSearchResult } from '../../api/types';
import { LearnStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LearnStackParamList, 'TextbookSearch'>;
const DEBOUNCE_MS = 350;

export function TextbookSearchScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId } = route.params;
  const { search } = useTextbookSearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TextbookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    (q: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (!q.trim()) {
        setResults([]);
        return;
      }
      debounceTimer.current = setTimeout(async () => {
        setLoading(true);
        try {
          setResults(await search(subjectId, q.trim()));
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_MS);
    },
    [subjectId, search]
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Search" onBack={() => navigation.goBack()} />
      </View>

      <View style={{ paddingHorizontal: t.spacing.md, marginTop: 8 }}>
        <View style={[styles.inputRow, { backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md }]}>
          <Ionicons name="search-outline" size={18} color={t.colors.textSecondary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              runSearch(text);
            }}
            placeholder="Search this textbook..."
            placeholderTextColor={t.colors.textSecondary}
            style={[t.typography.body, { color: t.colors.textPrimary, flex: 1, marginLeft: 8, paddingVertical: 12 }]}
          />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.sectionId}
        contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}
        ListEmptyComponent={
          !loading && query.trim().length > 0 ? (
            <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: 20, textAlign: 'center' }]}>
              No matches found.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('TextbookReader', { subjectId, sectionId: item.sectionId })}
            style={[styles.resultCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
          >
            <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]} numberOfLines={1}>
              {item.sectionTitle}
            </Text>
            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 4 }]} numberOfLines={2}>
              {item.snippet}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  resultCard: { padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
});
