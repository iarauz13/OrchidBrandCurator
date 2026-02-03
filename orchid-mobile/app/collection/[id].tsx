import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  SectionListData,
  Image,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { StoreItem } from '@/types/models';
import { AlphabetSidebar } from '@/components/AlphabetSidebar';
import { ScalableButton } from '@/components/ui/ScalableButton';

interface Section {
  title: string;
  data: StoreItem[];
}

// Get first letter or '#' for non-alphabetic
const getFirstLetter = (name: string): string => {
  const first = name.charAt(0).toUpperCase();
  if (/[A-Z]/.test(first)) return first;
  return '#';
};

// Sort stores: A-Z first, then symbols/numbers
const sortStores = (stores: StoreItem[]): StoreItem[] => {
  return [...stores].sort((a, b) => {
    const aName = a.name?.toUpperCase() || '';
    const bName = b.name?.toUpperCase() || '';
    const aIsLetter = /^[A-Z]/.test(aName);
    const bIsLetter = /^[A-Z]/.test(bName);

    if (aIsLetter && !bIsLetter) return -1;
    if (!aIsLetter && bIsLetter) return 1;
    return aName.localeCompare(bName);
  });
};

// Group stores into sections by letter
const groupByLetter = (stores: StoreItem[]): Section[] => {
  const sorted = sortStores(stores);
  const groups: { [key: string]: StoreItem[] } = {};

  sorted.forEach((store) => {
    const letter = getFirstLetter(store.name || '');
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(store);
  });

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
};

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { collections } = useCollectionStore();

  const sectionListRef = useRef<SectionList<StoreItem, Section>>(null);
  const [activeLetter, setActiveLetter] = useState<string>('A');

  // Find collection by ID
  const collection = useMemo(() => {
    return collections.find((c) => c.id === id);
  }, [collections, id]);

  // Group stores into sections
  const sections = useMemo(() => {
    if (!collection?.stores) return [];
    return groupByLetter(collection.stores);
  }, [collection]);

  // Get available letters
  const availableLetters = useMemo(() => {
    return sections.map((s) => s.title);
  }, [sections]);

  // Handle alphabet sidebar press
  const handleLetterPress = useCallback((letter: string) => {
    const sectionIndex = sections.findIndex((s) => s.title === letter);
    if (sectionIndex !== -1) {
      setActiveLetter(letter);
      sectionListRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewOffset: 50,
      });
    }
  }, [sections]);

  // Track visible section
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstItem = viewableItems[0];
      if (firstItem.section?.title) {
        setActiveLetter(firstItem.section.title);
      }
    }
  }, []);

  const renderStoreItem = ({ item }: { item: StoreItem }) => (
    <ScalableButton
      style={[styles.storeRow, { borderBottomColor: currentTheme.border }]}
      onPress={() => {
        // TODO: Navigate to store detail
      }}
    >
      <View style={styles.storeContent}>
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.storeLogo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: currentTheme.backgroundTertiary }]}>
            <Text style={[styles.logoInitial, { color: currentTheme.textSecondary }]}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: currentTheme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.category && (
            <Text style={[styles.storeCategory, { color: currentTheme.textSecondary }]} numberOfLines={1}>
              {item.category}
            </Text>
          )}
        </View>
        <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} />
      </View>
    </ScalableButton>
  );

  const renderSectionHeader = ({ section }: { section: SectionListData<StoreItem, Section> }) => (
    <View style={[styles.sectionHeader, { backgroundColor: currentTheme.backgroundSecondary }]}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{section.title}</Text>
    </View>
  );

  if (!collection) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.textSecondary }]}>
          Collection not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={20} color={currentTheme.tint} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]} numberOfLines={1}>
            {collection.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>
            {collection.stores?.length || 0} brands
          </Text>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <FontAwesome name="search" size={18} color={currentTheme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Store List with Alphabet Sidebar */}
      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderStoreItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          getItemLayout={(data, index) => {
            // Fixed heights: item = 68px, section header = 31px
            const ITEM_HEIGHT = 68;
            const HEADER_HEIGHT = 31;
            return {
              length: ITEM_HEIGHT,
              offset: index * ITEM_HEIGHT,
              index,
            };
          }}
          onScrollToIndexFailed={() => {
            // Silently handle scroll failures - happens when list hasn't rendered yet
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="inbox" size={48} color={currentTheme.textTertiary} />
              <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                No brands in this collection
              </Text>
              <Text style={[styles.emptySubtext, { color: currentTheme.textTertiary }]}>
                Import a CSV or add brands manually
              </Text>
            </View>
          }
        />

        {/* Alphabet Sidebar */}
        {sections.length > 0 && (
          <AlphabetSidebar
            letters={availableLetters}
            activeLetter={activeLetter}
            onLetterPress={handleLetterPress}
            theme={currentTheme}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerInfo: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  } as TextStyle,
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  } as TextStyle,
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  listContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  listContent: {
    paddingRight: 28, // Space for alphabet sidebar
    paddingBottom: 100,
  } as ViewStyle,
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  } as TextStyle,
  storeRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } as ViewStyle,
  storeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  storeLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  } as ImageStyle,
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  logoInitial: {
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  storeInfo: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  storeName: {
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  storeCategory: {
    fontSize: 13,
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  } as ViewStyle,
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  } as TextStyle,
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  } as TextStyle,
});
