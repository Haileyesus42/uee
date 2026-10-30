import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import {
  joinSchool,
  searchSchools,
  submitSchoolRequest,
  SchoolSearchResponse,
  SchoolSearchResult,
} from '../../api/leaderboard';
import { LeaderboardStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LeaderboardStackParamList, 'SchoolPicker'>;

export function SchoolPickerScreen({ navigation }: Props) {
  const t = useTheme();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [requestMode, setRequestMode] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqRegion, setReqRegion] = useState('');
  const [reqCity, setReqCity] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const search = useQuery<SchoolSearchResponse>({
    queryKey: ['school-search', query],
    queryFn: () => searchSchools(query),
    enabled: query.length >= 2 && !requestMode,
  });

  const join = useMutation<{ ok: boolean }, Error, string>({
    mutationFn: (schoolId: string) => joinSchool(schoolId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      setFeedback(err.message || 'Could not join school.');
    },
  });

  const submitReq = useMutation<{ ok: boolean; requestId: string; status: string }, Error, void>({
    mutationFn: () =>
      submitSchoolRequest({
        name: reqName.trim(),
        region: reqRegion.trim(),
        city: reqCity.trim() || undefined,
      }),
    onSuccess: () => {
      setFeedback("Request submitted — we'll review and add your school soon.");
      setRequestMode(false);
      setReqName('');
      setReqRegion('');
      setReqCity('');
    },
    onError: (err: Error) => {
      setFeedback(err.message || 'Could not submit request.');
    },
  });

  const canSubmit = reqName.trim().length >= 3 && reqRegion.trim().length >= 2;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title={requestMode ? 'Request a school' : 'Select your school'} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}>
        {!requestMode ? (
          <>
            <View style={[styles.searchBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
              <Ionicons name="search" size={16} color={t.colors.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search school name…"
                placeholderTextColor={t.colors.textSecondary}
                style={[styles.searchInput, { color: t.colors.textPrimary }]}
                autoFocus
              />
            </View>

            {query.length >= 2 && search.isLoading && (
              <ActivityIndicator color={t.colors.brand} style={{ marginTop: 20 }} />
            )}

            {query.length >= 2 && search.data?.schools.length === 0 && (
              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center' }]}>
                  No schools found for "{query}".
                </Text>
                <Pressable onPress={() => setRequestMode(true)} style={{ marginTop: 12 }}>
                  <Text style={[t.typography.bodyStrong, { color: t.colors.brand }]}>
                    Request to add your school →
                  </Text>
                </Pressable>
              </View>
            )}

            {search.data?.schools.map((s: SchoolSearchResult) => (
              <Pressable
                key={s.id}
                onPress={() => join.mutate(s.id)}
                disabled={join.isPending}
                style={[
                  styles.schoolRow,
                  { backgroundColor: t.colors.surface, borderColor: t.colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary }]}>
                    {s.name}
                  </Text>
                  <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>
                    {s.region}{s.city ? ` · ${s.city}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} />
              </Pressable>
            ))}

            {query.length < 2 && (
              <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 12 }]}>
                Type at least 2 characters to search.
              </Text>
            )}

            {feedback && (
              <Text style={[t.typography.caption, { color: t.colors.error, marginTop: 16 }]}>
                {feedback}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 16 }]}>
              Can't find your school? Submit a request and we'll add it after review.
            </Text>

            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginBottom: 4 }]}>
              School name
            </Text>
            <TextInput
              value={reqName}
              onChangeText={setReqName}
              placeholder="e.g. Menelik II Secondary School"
              placeholderTextColor={t.colors.textSecondary}
              style={[styles.field, { backgroundColor: t.colors.surface, borderColor: t.colors.border, color: t.colors.textPrimary }]}
            />

            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 12, marginBottom: 4 }]}>
              Region
            </Text>
            <TextInput
              value={reqRegion}
              onChangeText={setReqRegion}
              placeholder="e.g. Addis Ababa"
              placeholderTextColor={t.colors.textSecondary}
              style={[styles.field, { backgroundColor: t.colors.surface, borderColor: t.colors.border, color: t.colors.textPrimary }]}
            />

            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 12, marginBottom: 4 }]}>
              City / zone (optional)
            </Text>
            <TextInput
              value={reqCity}
              onChangeText={setReqCity}
              placeholder="e.g. Bole"
              placeholderTextColor={t.colors.textSecondary}
              style={[styles.field, { backgroundColor: t.colors.surface, borderColor: t.colors.border, color: t.colors.textPrimary }]}
            />

            <Pressable
              onPress={() => submitReq.mutate()}
              disabled={!canSubmit || submitReq.isPending}
              style={[
                styles.submitBtn,
                { backgroundColor: !canSubmit || submitReq.isPending ? t.colors.border : t.colors.brand },
              ]}
            >
              <Text style={[t.typography.bodyStrong, { color: t.colors.textInverse }]}>
                {submitReq.isPending ? 'Submitting…' : 'Submit request'}
              </Text>
            </Pressable>

            <Pressable onPress={() => setRequestMode(false)} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={[t.typography.caption, { color: t.colors.brand }]}>← Back to search</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  field: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});