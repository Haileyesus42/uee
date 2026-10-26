import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFamily } from '../../theme/tokens';
import { useTextbookSection, useReadingProgress, useBookmarks, useHighlights } from '../../hooks/useTextbook';
import { getTextbookSection } from '../../api/textbook';
import { LearnStackParamList } from '../../navigation/types';
import { TextbookContentBlock } from '../../api/types';
import { MathText } from '../../components/common/MathText';
import { FacsimilePager } from '../../components/learn/FacsimilePager';

type Props = NativeStackScreenProps<LearnStackParamList, 'TextbookReader'>;

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const SCREEN_WIDTH = Dimensions.get('window').width;

type ReadingTheme = 'default' | 'sepia' | 'night';
const READING_THEMES: Record<ReadingTheme, { bg: string; text: string; heading: string }> = {
  default: { bg: '#FFFFFF', text: '#1F2937', heading: '#0F172A' },
  sepia: { bg: '#F4ECD8', text: '#433422', heading: '#2B1F12' },
  night: { bg: '#121212', text: '#D8D8D8', heading: '#F4F4F5' },
};
// A compact-first scale (was [15,17,19,22], default index 1 = 17px) — the
// PDF's own font sizes were never used here (extraction stores plain text),
// this was already a from-scratch reader scale, just tuned too large by
// default. Lowered across the board and defaults to the smallest step.
const FONT_SIZES = [14, 16, 18, 21];
const DEFAULT_FONT_SIZE_INDEX = 0;
// Heading levels 1-3 step down from the body size by a fixed amount rather
// than reusing the app's global h1/h2/h3 tokens (26/21/17px) — those are
// tuned for sparse UI chrome (one heading per screen), not a dense reading
// column with many headings, where that scale reads oversized and eats too
// much vertical space.
const HEADING_DELTA: Record<1 | 2 | 3, number> = { 1: 8, 2: 5, 3: 2 };

function ImageViewerModal({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const win = Dimensions.get('window');
  return (
    <Modal visible={uri !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.viewerBackdrop} onPress={onClose}>
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: win.width, height: win.height * 0.85 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        ) : null}
        <Pressable style={styles.viewerClose} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReaderList({
  block,
  baseSize,
  color,
}: {
  block: Extract<TextbookContentBlock, { type: 'list' }>;
  baseSize: number;
  color: string;
}) {
  return (
    <View style={styles.list}>
      {block.items.map((item, idx) => (
        <View key={idx} style={styles.listRow}>
          <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: baseSize, lineHeight: baseSize * 1.5, color, width: 22 }}>
            {block.ordered ? `${idx + 1}.` : '•'}
          </Text>
          <View style={{ flex: 1 }}>
            <MathText style={{ fontFamily: fontFamily.bodyRegular, fontSize: baseSize, lineHeight: baseSize * 1.5, color }}>
              {item}
            </MathText>
          </View>
        </View>
      ))}
    </View>
  );
}

function ReaderTable({
  block,
  baseSize,
  color,
  border,
}: {
  block: Extract<TextbookContentBlock, { type: 'table' }>;
  baseSize: number;
  color: string;
  border: string;
}) {
  return (
    <View style={styles.tableBlock}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={[styles.table, { borderColor: border }]}>
          {block.rows.map((row, ri) => (
            <View key={ri} style={[styles.tableRow, { borderColor: border }, ri === 0 && styles.tableHeaderRow]}>
              {row.map((cell, ci) => (
                <View key={ci} style={[styles.tableCell, { borderColor: border }]}>
                  <Text
                    style={{
                      fontFamily: ri === 0 ? fontFamily.bodySemibold : fontFamily.bodyRegular,
                      fontSize: baseSize - 1,
                      color,
                    }}
                  >
                    {cell}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {block.caption ? (
        <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: baseSize - 2, color, opacity: 0.75, marginTop: 6 }}>
          {block.caption}
        </Text>
      ) : null}
    </View>
  );
}

// Reading-preference state (font size, sepia/night theme) is deliberately local
// to this screen, layered visually on top of the app's own light/dark theme —
// there's no per-screen override mechanism in ThemeProvider, and reusing its
// toggleScheme() here would flip the whole app's theme, not just the reader.
// Warms the cache for a section the reader is about to need (not yet asked
// for) — the section JSON itself (titles/blocks metadata, no image bytes) and
// its very first page image, so crossing into it is instant rather than
// waiting on both a network round trip and a cold image fetch at once.
export async function prefetchSection(
  queryClient: ReturnType<typeof useQueryClient>,
  sectionId: string | null | undefined,
  apiUrl: string
) {
  if (!sectionId) return;
  const data = await queryClient.fetchQuery({
    queryKey: ['textbookSection', sectionId],
    queryFn: () => getTextbookSection(sectionId),
  });
  const firstImage = data.blocks.find((b): b is Extract<TextbookContentBlock, { type: 'image' }> => b.type === 'image');
  if (firstImage) void Image.prefetch(`${apiUrl}/textbook/images/${firstImage.filename}`, 'memory-disk').catch(() => {});
}

export function TextbookReaderScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { subjectId, sectionId, kind = 'textbook', initialPage } = route.params;
  const { data: section } = useTextbookSection(sectionId);
  const { data: progress, saveProgress } = useReadingProgress(subjectId, kind);
  const queryClient = useQueryClient();

  // As soon as this section's own data is in, warm the next one — the section
  // JSON is tiny (titles/metadata, not image bytes) so there's no cost to
  // doing this immediately rather than waiting until the user is near the end.
  useEffect(() => {
    if (section?.nextSectionId) void prefetchSection(queryClient, section.nextSectionId, API_URL);
  }, [section?.nextSectionId, queryClient]);
  const { data: bookmarks, toggleBookmark } = useBookmarks(subjectId);
  const { data: highlights, toggleHighlight } = useHighlights(sectionId);
  const currentBookmark = bookmarks?.find((b) => b.sectionId === sectionId);
  const highlightedIndices = new Set((highlights ?? []).map((h) => h.paragraphIndex));

  const [fontSizeIndex, setFontSizeIndex] = useState(DEFAULT_FONT_SIZE_INDEX);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('default');
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const rt = READING_THEMES[readingTheme];

  const paragraphY = useRef<number[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasRestoredScroll = useRef(false);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!section) return;
      const y = e.nativeEvent.contentOffset.y;
      let current = 0;
      for (let i = 0; i < paragraphY.current.length; i += 1) {
        if (paragraphY.current[i] <= y + 40) current = i;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveProgress(sectionId, current), 1200);
    },
    [section, sectionId, saveProgress]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!section) return null;

  // Facsimile sections hold one image per printed page. Rendering them in the
  // text ScrollView reads as one endless article, so they get a paged reader:
  // one page per screen, swiped horizontally.
  const facsimilePages = section.blocks.filter(
    (b): b is Extract<TextbookContentBlock, { type: 'image' }> => b.type === 'image'
  );
  if (section.isFacsimile && facsimilePages.length > 0) {
    const initialIndex = Math.max(
      0,
      initialPage != null
        ? initialPage - section.pageStart
        : progress?.sectionId === sectionId
          ? progress.paragraphIndex
          : 0
    );
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: rt.bg }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: t.colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={rt.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: rt.text }]} numberOfLines={1}>
            {section.sectionTitle}
          </Text>
          <Pressable onPress={() => toggleBookmark(sectionId, currentBookmark?.id)} hitSlop={8}>
            <Ionicons
              name={currentBookmark ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={currentBookmark ? t.colors.brand : rt.text}
            />
          </Pressable>
        </View>

        <FacsimilePager
          pages={facsimilePages}
          pageStart={section.pageStart}
          pageEnd={section.pageEnd}
          initialIndex={initialIndex}
          apiUrl={API_URL}
          textColor={rt.text}
          hasPrev={!!section.prevSectionId}
          hasNext={!!section.nextSectionId}
          onPageChange={(index) => saveProgress(sectionId, index)}
          onOpenImage={(filename) => setViewerUri(`${API_URL}/textbook/images/${filename}`)}
          onPrevSection={() =>
            section.prevSectionId &&
            navigation.replace('TextbookReader', {
              subjectId,
              sectionId: section.prevSectionId,
              kind,
              // Land on the previous section's last page so paging backwards
              // is continuous instead of jumping to its first page.
              initialPage: Number.MAX_SAFE_INTEGER,
            })
          }
          onNextSection={() =>
            section.nextSectionId &&
            navigation.replace('TextbookReader', {
              subjectId,
              sectionId: section.nextSectionId,
              kind,
            })
          }
        />

        <ImageViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
      </SafeAreaView>
    );
  }

  const baseSize = FONT_SIZES[fontSizeIndex];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: rt.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: t.colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={rt.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: rt.text }]} numberOfLines={1}>
          {section.sectionTitle}
        </Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Pressable
            onPress={() => setFontSizeIndex((i) => Math.max(0, i - 1))}
            hitSlop={8}
            disabled={fontSizeIndex === 0}
          >
            <Ionicons name="remove-circle-outline" size={22} color={rt.text} style={{ opacity: fontSizeIndex === 0 ? 0.4 : 1 }} />
          </Pressable>
          <Pressable
            onPress={() => setFontSizeIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
            hitSlop={8}
            disabled={fontSizeIndex === FONT_SIZES.length - 1}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={rt.text}
              style={{ opacity: fontSizeIndex === FONT_SIZES.length - 1 ? 0.4 : 1 }}
            />
          </Pressable>
          <Pressable
            onPress={() =>
              setReadingTheme((cur) => (cur === 'default' ? 'sepia' : cur === 'sepia' ? 'night' : 'default'))
            }
            hitSlop={8}
          >
            <Ionicons name="color-palette-outline" size={22} color={rt.text} />
          </Pressable>
          <Pressable onPress={() => toggleBookmark(sectionId, currentBookmark?.id)} hitSlop={8}>
            <Ionicons
              name={currentBookmark ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={currentBookmark ? t.colors.brand : rt.text}
            />
          </Pressable>
        </View>
      </View>

      {section.lessonId && section.unitId ? (
        <Pressable
          style={[styles.lessonLink, { backgroundColor: t.colors.brandLight }]}
          onPress={() =>
            navigation.navigate('LessonIntroduction', {
              subjectId,
              unitId: section.unitId as string,
              lessonId: section.lessonId as string,
            })
          }
        >
          <Ionicons name="trail-sign-outline" size={16} color={t.colors.brand} />
          <Text style={[t.typography.bodyStrong, { color: t.colors.brand, marginLeft: 6, fontSize: 13 }]}>
            Practice this as a guided lesson
          </Text>
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        onContentSizeChange={() => {
          if (hasRestoredScroll.current) return;
          hasRestoredScroll.current = true;
          // A page-number jump (facsimile editions) wins over saved progress:
          // the requested page maps to a block index within this section.
          if (initialPage != null && section) {
            const idx = Math.max(
              0,
              Math.min(initialPage - section.pageStart, section.blocks.length - 1)
            );
            const y = paragraphY.current[idx];
            if (y != null) scrollViewRef.current?.scrollTo({ y, animated: false });
            return;
          }
          // Resume at the saved paragraph, but only when reopening the exact
          // section that progress points to — arriving via TOC/search/prev-next
          // instead should just start at the top of that section.
          if (progress?.sectionId === sectionId) {
            const y = paragraphY.current[progress.paragraphIndex];
            if (y) scrollViewRef.current?.scrollTo({ y, animated: false });
          }
        }}
      >
        {section.blocks.map((block, i) => {
          const isHighlighted = highlightedIndices.has(i);
          const highlightId = highlights?.find((h) => h.paragraphIndex === i)?.id;

          if (block.type === 'image') {
            // Contained to the reading column's width, aspect-ratio preserved
            // from the real extracted dimensions rather than a fixed box.
            // Tap to open a full-screen viewer for close inspection of detail
            // that doesn't fit legibly in the reading-column-sized preview.
            const displayWidth = SCREEN_WIDTH - t.spacing.md * 2;
            const displayHeight = displayWidth * (block.height / block.width);
            const uri = `${API_URL}/textbook/images/${block.filename}`;
            return (
              <View
                key={i}
                onLayout={(e) => {
                  paragraphY.current[i] = e.nativeEvent.layout.y;
                }}
                style={styles.imageBlock}
              >
                <Pressable onPress={() => setViewerUri(uri)}>
                  <Image
                    source={{ uri }}
                    style={{ width: displayWidth, height: displayHeight, borderRadius: 8 }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </Pressable>
                {block.caption ? (
                  <Text
                    style={{
                      fontFamily: fontFamily.bodyMedium,
                      fontSize: baseSize - 2,
                      color: rt.text,
                      opacity: 0.75,
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    {block.caption}
                  </Text>
                ) : null}
              </View>
            );
          }

          const containerStyle = [
            styles.paragraph,
            block.type === 'heading' && styles.headingParagraph,
            isHighlighted && { backgroundColor: t.colors.brandLight, borderRadius: 6 },
          ];

          if (block.type === 'list') {
            return (
              <View key={i} onLayout={(e) => (paragraphY.current[i] = e.nativeEvent.layout.y)} style={containerStyle}>
                <ReaderList block={block} baseSize={baseSize} color={rt.text} />
              </View>
            );
          }

          if (block.type === 'table') {
            return (
              <View key={i} onLayout={(e) => (paragraphY.current[i] = e.nativeEvent.layout.y)} style={containerStyle}>
                <ReaderTable block={block} baseSize={baseSize} color={rt.text} border={t.colors.border} />
              </View>
            );
          }

          const isHeading = block.type === 'heading';
          const size = isHeading ? baseSize + HEADING_DELTA[block.level] : baseSize;
          return (
            <Pressable
              key={i}
              onLongPress={() => toggleHighlight(i, highlightId)}
              onLayout={(e) => {
                paragraphY.current[i] = e.nativeEvent.layout.y;
              }}
              style={containerStyle}
            >
              <MathText
                style={{
                  fontFamily: isHeading ? fontFamily.headingBold : fontFamily.bodyRegular,
                  fontSize: size,
                  lineHeight: isHeading ? size * 1.3 : size * 1.5,
                  color: isHighlighted ? t.colors.textPrimary : isHeading ? rt.heading : rt.text,
                }}
              >
                {block.text}
              </MathText>
            </Pressable>
          );
        })}

        <View style={[styles.navRow, { borderTopColor: t.colors.border }]}>
          <Pressable
            disabled={!section.prevSectionId}
            onPress={() => section.prevSectionId && navigation.replace('TextbookReader', { subjectId, sectionId: section.prevSectionId, kind })}
            style={{ opacity: section.prevSectionId ? 1 : 0.3 }}
          >
            <View style={styles.navButton}>
              <Ionicons name="chevron-back" size={18} color={rt.text} />
              <Text style={[styles.navLabel, { color: rt.text, marginLeft: 4 }]}>Previous</Text>
            </View>
          </Pressable>
          <Pressable
            disabled={!section.nextSectionId}
            onPress={() => section.nextSectionId && navigation.replace('TextbookReader', { subjectId, sectionId: section.nextSectionId, kind })}
            style={{ opacity: section.nextSectionId ? 1 : 0.3 }}
          >
            <View style={styles.navButton}>
              <Text style={[styles.navLabel, { color: rt.text, marginRight: 4 }]}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={rt.text} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ImageViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { flex: 1, fontFamily: fontFamily.headingSemibold, fontSize: 15, marginHorizontal: 12 },
  paragraph: { marginBottom: 14, paddingVertical: 2, paddingHorizontal: 4, marginHorizontal: -4 },
  imageBlock: { alignItems: 'center', marginBottom: 20 },
  headingParagraph: { marginTop: 10, marginBottom: 8 },
  lessonLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  navButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  navLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 14 },
  list: { gap: 6 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tableBlock: { marginBottom: 4 },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tableHeaderRow: { backgroundColor: 'rgba(0,0,0,0.04)' },
  tableCell: { paddingVertical: 8, paddingHorizontal: 10, borderRightWidth: StyleSheet.hairlineWidth, minWidth: 90 },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerClose: { position: 'absolute', top: 50, right: 20, padding: 8 },
});
