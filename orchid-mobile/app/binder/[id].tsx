import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  Image,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useBinderStore } from '@/stores/useBinderStore';
import { StoreItem } from '@/types/models';
import { ScalableButton } from '@/components/ui/ScalableButton';
import { AddBrandsModal } from '@/components/AddBrandsModal';

type ViewMode = 'list' | 'grid';

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

export default function BinderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { binders, addItemsToBinder, removeItemFromBinder } = useBinderStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [addBrandsModalVisible, setAddBrandsModalVisible] = useState(false);

  // Find binder by ID
  const binder = useMemo(() => {
    return binders.find((b) => b.id === id);
  }, [binders, id]);

  // Get items from binder
  const items = useMemo(() => {
    return binder?.items || [];
  }, [binder]);

  // Group items into sections for list view
  const sections = useMemo(() => {
    return groupByLetter(items);
  }, [items]);

  const handleAddBrands = (selectedItems: StoreItem[]) => {
    if (id) {
      addItemsToBinder(id, selectedItems);
    }
    setAddBrandsModalVisible(false);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
  };

  const handleRemoveItem = (item: StoreItem) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Remove from Binder'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: item.name,
          message: 'This will remove the store from this binder only. It will still exist in your collections.',
        },
        (buttonIndex) => {
          if (buttonIndex === 1 && id) {
            removeItemFromBinder(id, item.id);
          }
        }
      );
    } else {
      Alert.alert(
        item.name || 'Remove Store',
        'This will remove the store from this binder only. It will still exist in your collections.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove from Binder',
            style: 'destructive',
            onPress: () => {
              if (id) {
                removeItemFromBinder(id, item.id);
              }
            },
          },
        ]
      );
    }
  };

  // List view item
  const renderListItem = ({ item }: { item: StoreItem }) => (
    <ScalableButton
      style={[styles.listRow, { borderBottomColor: currentTheme.border }]}
      onPress={() => {
        router.push({
          pathname: `/brand/${item.id}`,
          params: { binderId: id }
        });
      }}
      onLongPress={() => handleRemoveItem(item)}
      delayLongPress={400}
    >
      <View style={styles.listContent}>
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.listLogo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: currentTheme.backgroundTertiary }]}>
            <Text style={[styles.logoInitial, { color: currentTheme.textSecondary }]}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.listInfo}>
          <Text style={[styles.listName, { color: currentTheme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.category && (
            <Text style={[styles.listCategory, { color: currentTheme.textSecondary }]} numberOfLines={1}>
              {item.category}
            </Text>
          )}
        </View>
        <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} />
      </View>
    </ScalableButton>
  );

  // Grid view item
  const renderGridItem = ({ item }: { item: StoreItem }) => (
    <ScalableButton
      style={[styles.gridItem, { backgroundColor: currentTheme.card }]}
      onPress={() => {
        router.push({
          pathname: `/brand/${item.id}`,
          params: { binderId: id }
        });
      }}
      onLongPress={() => handleRemoveItem(item)}
      delayLongPress={400}
    >
      {item.logoUrl ? (
        <Image source={{ uri: item.logoUrl }} style={styles.gridLogo} />
      ) : (
        <View style={[styles.gridLogoPlaceholder, { backgroundColor: currentTheme.backgroundTertiary }]}>
          <Text style={[styles.gridLogoInitial, { color: currentTheme.textSecondary }]}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <Text style={[styles.gridName, { color: currentTheme.text }]} numberOfLines={2}>
        {item.name}
      </Text>
    </ScalableButton>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: currentTheme.backgroundSecondary }]}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{section.title}</Text>
    </View>
  );

  if (!binder) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.textSecondary }]}>
          Binder not found
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
            {binder.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>
            {items.length} brands
          </Text>
        </View>
        <TouchableOpacity onPress={toggleViewMode} style={styles.viewToggle}>
          <FontAwesome
            name={viewMode === 'list' ? 'th-large' : 'list'}
            size={18}
            color={currentTheme.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAddBrandsModalVisible(true)} style={styles.addButton}>
          <FontAwesome name="plus" size={18} color={currentTheme.tint} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="inbox" size={48} color={currentTheme.textTertiary} />
          <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            No brands in this binder
          </Text>
          <Text style={[styles.emptySubtext, { color: currentTheme.textTertiary }]}>
            Tap + to add brands from your collections
          </Text>
          <ScalableButton
            style={[styles.emptyButton, { backgroundColor: currentTheme.tint }]}
            onPress={() => setAddBrandsModalVisible(true)}
          >
            <FontAwesome name="plus" size={16} color="#fff" />
            <Text style={styles.emptyButtonText}>Add Brands</Text>
          </ScalableButton>
        </View>
      ) : viewMode === 'list' ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.sectionListContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={sortStores(items)}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Brands Modal */}
      <AddBrandsModal
        visible={addBrandsModalVisible}
        binderId={id || ''}
        onClose={() => setAddBrandsModalVisible(false)}
        onAdd={handleAddBrands}
      />
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
    gap: 8,
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
  viewToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  // List view styles
  listRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } as ViewStyle,
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  sectionListContent: {
    paddingBottom: 100,
  } as ViewStyle,
  listLogo: {
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
  listInfo: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  listName: {
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  listCategory: {
    fontSize: 13,
  } as TextStyle,
  // Grid view styles
  gridContent: {
    padding: 12,
    paddingBottom: 100,
  } as ViewStyle,
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  } as ViewStyle,
  gridItem: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  gridLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  } as ImageStyle,
  gridLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  gridLogoInitial: {
    fontSize: 28,
    fontWeight: '600',
  } as TextStyle,
  gridName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
  // Section headers
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  } as TextStyle,
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  } as ViewStyle,
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  } as TextStyle,
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  } as ViewStyle,
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  } as TextStyle,
});
