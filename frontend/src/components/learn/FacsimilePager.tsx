import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type FacsimilePage = {
  filename: string;
  width: number;
  height: number;
  caption?: string;
};

type Sentinel = { sentinel: 'prev' | 'next' };
type Item = FacsimilePage | Sentinel;

type Props = {
  pages: FacsimilePage[];
  pageStart: number;
  pageEnd: number;
  initialIndex: number;
  apiUrl: string;
  textColor: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (index: number) => void;
  onOpenImage: (filename: string) => void;
  onPrevSection: () => void;
  onNextSection: () => void;
};

const pageUri = (apiUrl: string, filename: string) => `${apiUrl}/textbook/images/${filename}`;

// Memoized so a page turn (which updates the counter) does not re-render every
// mounted neighbour, and `fadeDuration={0}` avoids Android's fade-in delay.
const PageItem = memo(function PageItem({
  uri,
  size,
  onPress,
}: {
  uri: string;
  size: { width: number; height?: number };
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.page, size]} onPress={onPress}>
      <Image source={{ uri }} style={size} resizeMode="contain" fadeDuration={0} />
    </Pressable>
  );
});

// One printed page per screen, swiped horizontally. The page area is white so
// the letterboxing around a portrait page blends with the paper instead of
// showing as a dark gap, and the swipe ends carry "previous/next section"
// sentinels so reading flows across section boundaries without a button.
export function FacsimilePager({
  pages,
  pageStart,
  pageEnd,
  initialIndex,
  apiUrl,
  textColor,
  hasPrev,
  hasNext,
  onPageChange,
  onOpenImage,
  onPrevSection,
  onNextSection,
}: Props) {
  const { width } = useWindowDimensions();
  const [areaHeight, setAreaHeight] = useState(0);
  const offset = hasPrev ? 1 : 0;
  const startPage = Math.max(0, Math.min(initialIndex, pages.length - 1));
  const [index, setIndex] = useState(startPage);
  const listRef = useRef<FlatList<Item>>(null);

  const data: Item[] = [
    ...(hasPrev ? [{ sentinel: 'prev' as const }] : []),
    ...pages,
    ...(hasNext ? [{ sentinel: 'next' as const }] : []),
  ];

  // Warm the pages around the current one so a swipe never waits on the
  // network. Two ahead, because fast swiping is common while skimming.
  const prefetchAround = useCallback(
    (i: number) => {
      [i + 1, i + 2, i - 1].forEach((n) => {
        const page = pages[n];
        if (page) void Image.prefetch(pageUri(apiUrl, page.filename)).catch(() => {});
      });
    },
    [pages, apiUrl]
  );

  useEffect(() => {
    prefetchAround(index);
  }, [index, prefetchAround]);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      if (i < offset) {
        onPrevSection();
        return;
      }
      if (i >= offset + pages.length) {
        onNextSection();
        return;
      }
      const pageIndex = i - offset;
      if (pageIndex === index) return;
      setIndex(pageIndex);
      onPageChange(pageIndex);
    },
    [index, width, offset, pages.length, onPageChange, onPrevSection, onNextSection]
  );

  const pageSize = useMemo(
    () => ({ width, height: areaHeight > 0 ? areaHeight : undefined }),
    [width, areaHeight]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      if ('sentinel' in item) {
        const isNext = item.sentinel === 'next';
        return (
          <Pressable
            style={[styles.page, styles.sentinelPage, pageSize]}
            onPress={isNext ? onNextSection : onPrevSection}
          >
            <Ionicons
              name={isNext ? 'arrow-forward-circle-outline' : 'arrow-back-circle-outline'}
              size={56}
              color="#8a8a8a"
            />
            <Text style={styles.sentinelLabel}>{isNext ? 'Next section' : 'Previous section'}</Text>
          </Pressable>
        );
      }
      return (
        <PageItem
          uri={pageUri(apiUrl, item.filename)}
          size={pageSize}
          onPress={() => onOpenImage(item.filename)}
        />
      );
    },
    [apiUrl, pageSize, onOpenImage, onPrevSection, onNextSection]
  );

  return (
    <View style={styles.flex} onLayout={(e) => setAreaHeight(e.nativeEvent.layout.height)}>
      <FlatList
        ref={listRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        extraData={`${width}:${areaHeight}`}
        keyExtractor={(item, i) => ('sentinel' in item ? `${item.sentinel}-${i}` : `${item.filename}-${i}`)}
        initialScrollIndex={offset + startPage}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollToIndexFailed={() => {}}
        // Keep neighbours mounted and decoded; unmounting them is what made a
        // swipe wait for a fresh download.
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={false}
        renderItem={renderItem}
      />
      <View style={styles.counter}>
        <Text style={[styles.counterText, { color: textColor }]}>
          Page {pageStart + index} of {pageEnd}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // White, not the app theme: a scanned page is white, so its margins blend
  // into this instead of reading as an empty band.
  page: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  sentinelPage: { backgroundColor: '#F2F2F2' },
  sentinelLabel: { marginTop: 10, fontSize: 15, color: '#6b6b6b' },
  counter: { paddingVertical: 6, alignItems: 'center' },
  counterText: { fontSize: 12, opacity: 0.75, letterSpacing: 0.3 },
});
