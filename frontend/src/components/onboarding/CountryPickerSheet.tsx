import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { COUNTRIES, Country } from '../../data/countries';

export function CountryPickerSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q));
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]}>
        <View style={[styles.header, { paddingHorizontal: t.spacing.md, borderBottomColor: t.colors.border }]}>
          <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>Select Country</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={[styles.closeButton, { backgroundColor: t.colors.surfaceAlt }]}
          >
            <Ionicons name="close" size={16} color={t.colors.textSecondary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: t.spacing.md, paddingTop: 12 }}>
          <View
            style={[
              styles.searchRow,
              { backgroundColor: t.colors.surface, borderColor: t.colors.border, borderRadius: t.radius.md },
            ]}
          >
            <Ionicons name="search" size={16} color={t.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country"
              placeholderTextColor={t.colors.textSecondary}
              style={[t.typography.body, styles.searchInput, { color: t.colors.textPrimary }]}
            />
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.iso}
          contentContainerStyle={{ paddingHorizontal: t.spacing.md, paddingTop: 8, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelect(item)} style={[styles.row, { borderBottomColor: t.colors.border }]}>
              <Text style={styles.flag}>{item.flag}</Text>
              <Text style={[t.typography.body, { color: t.colors.textPrimary, flex: 1, marginLeft: 12 }]}>
                {item.name}
              </Text>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{item.dialCode}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, marginLeft: 8, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  flag: { fontSize: 22 },
});
