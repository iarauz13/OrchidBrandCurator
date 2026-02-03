import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Alert, ActionSheetIOS, Platform, ViewStyle, TextStyle, ImageStyle, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { ScalableButton } from '@/components/ui/ScalableButton';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useRouter } from 'expo-router';
import { Collection } from '@/types/models';

export default function CollectionsScreen() {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { collections, setActiveCollection, loadSampleCollections, removeCollection, clearCollection, renameCollection, removeStoreFromCollection } = useCollectionStore();
  const router = useRouter();

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Search results grouping
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const resultsMap = new Map<string, { brand: any, collectionInfo: { id: string, name: string }[] }>();

    collections.forEach(col => {
      col.stores?.forEach(store => {
        if (store.name.toLowerCase().includes(query)) {
          const existing = resultsMap.get(store.name);
          if (existing) {
            existing.collectionInfo.push({ id: col.id, name: col.name });
          } else {
            resultsMap.set(store.name, {
              brand: store,
              collectionInfo: [{ id: col.id, name: col.name }]
            });
          }
        }
      });
    });

    return Array.from(resultsMap.values());
  }, [searchQuery, collections]);

  const handleRemoveDuplicate = (item: any) => {
    const options = item.collectionInfo.map((c: any) => `Remove from ${c.name}`);
    options.push('Cancel');

    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: `Remove duplicate: ${item.brand.name}`,
          message: 'Select the collection you want to remove this brand from.',
        },
        (buttonIndex) => {
          if (buttonIndex < cancelButtonIndex) {
            const collection = item.collectionInfo[buttonIndex];
            removeStoreFromCollection(collection.id, item.brand.id);
          }
        }
      );
    } else {
      Alert.alert(
        'Remove Duplicate',
        `Which collection should ${item.brand.name} be removed from?`,
        [
          ...item.collectionInfo.map((c: any) => ({
            text: c.name,
            onPress: () => removeStoreFromCollection(c.id, item.brand.id)
          })),
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  // Load sample collections if empty
  useEffect(() => {
    if (collections.length === 0) {
      loadSampleCollections();
    }
  }, []);

  const handleSelectCollection = (collection: Collection) => {
    setActiveCollection(collection.id);
    router.push(`/collection/${collection.id}`);
  };

  const handleLongPress = (collection: Collection) => {
    const options = [
      'Rename Collection',
      'Append Data (Import CSV)',
      'Clear Collection',
      'Remove Collection',
      'Cancel'
    ];
    const destructiveButtonIndex = [2, 3]; // Clear and Remove are destructive
    const cancelButtonIndex = 4;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: 3, // iOS only supports one destructive index
          cancelButtonIndex,
          title: collection.name,
          message: 'What would you like to do with this collection?',
        },
        (buttonIndex) => handleActionSelection(buttonIndex, collection)
      );
    } else {
      // Android fallback using Alert
      Alert.alert(
        collection.name,
        'What would you like to do with this collection?',
        [
          { text: 'Rename', onPress: () => handleActionSelection(0, collection) },
          { text: 'Append Data', onPress: () => handleActionSelection(1, collection) },
          { text: 'Clear (Permanent)', style: 'destructive', onPress: () => handleActionSelection(2, collection) },
          { text: 'Remove (Permanent)', style: 'destructive', onPress: () => handleActionSelection(3, collection) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleActionSelection = (buttonIndex: number, collection: Collection) => {
    switch (buttonIndex) {
      case 0: // Rename
        setSelectedCollection(collection);
        setNewName(collection.name);
        setRenameModalVisible(true);
        break;
      case 1: // Append Data
        // Navigate to profile import or show import modal
        Alert.alert(
          'Append Data',
          'Add more brands to this collection by importing a CSV or JSON file.\n\nGo to Profile → Import Data and select this collection.',
          [{ text: 'OK' }]
        );
        break;
      case 2: // Clear Collection
        Alert.alert(
          '⚠️ Clear Collection',
          `This will permanently delete all ${collection.stores?.length || 0} brands from "${collection.name}".\n\nThis action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear All',
              style: 'destructive',
              onPress: () => {
                clearCollection(collection.id);
                Alert.alert('Cleared', `All brands have been removed from "${collection.name}".`);
              }
            }
          ]
        );
        break;
      case 3: // Remove Collection
        Alert.alert(
          '⚠️ Remove Collection',
          `This will permanently delete "${collection.name}" and all ${collection.stores?.length || 0} brands inside it.\n\nThis action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Forever',
              style: 'destructive',
              onPress: () => {
                removeCollection(collection.id);
                Alert.alert('Deleted', `"${collection.name}" has been permanently removed.`);
              }
            }
          ]
        );
        break;
      default:
        break;
    }
  };

  const handleRename = () => {
    if (selectedCollection && newName.trim()) {
      renameCollection(selectedCollection.id, newName.trim());
      setRenameModalVisible(false);
      setSelectedCollection(null);
      setNewName('');
    }
  };

  const handleCreateCollection = () => {
    Alert.alert("Create Collection", "Collection creation will be implemented with full Firestore integration.");
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <ScalableButton
      style={[styles.searchResult, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
      onPress={() => router.push(`/brand/${item.brand.id}`)}
    >
      <View style={styles.searchResultContent}>
        <View style={styles.searchResultInfo}>
          <Text style={[styles.brandName, { color: currentTheme.text }]}>{item.brand.name}</Text>
          <Text style={[styles.collectionList, { color: currentTheme.textSecondary }]}>
            In Collections: {item.collectionInfo.map((c: any) => c.name).join(', ')}
          </Text>
        </View>
        {item.collectionInfo.length > 1 && (
          <TouchableOpacity
            style={[styles.removeDuplicateButton, { backgroundColor: currentTheme.backgroundTertiary }]}
            onPress={() => handleRemoveDuplicate(item)}
          >
            <FontAwesome name="copy" size={14} color={currentTheme.tint} />
            <Text style={[styles.removeDuplicateText, { color: currentTheme.tint }]}>Dedupe</Text>
          </TouchableOpacity>
        )}
        <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} style={{ marginLeft: 8 }} />
      </View>
    </ScalableButton>
  );

  const renderCollection = ({ item }: { item: Collection }) => (
    <ScalableButton
      style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
      onPress={() => handleSelectCollection(item)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <View style={styles.cardContent}>
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: currentTheme.backgroundTertiary }]}>
            <FontAwesome name="folder-open" size={32} color={currentTheme.textTertiary} />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: currentTheme.text }]}>{item.name}</Text>
          <Text style={[styles.cardSubtitle, { color: currentTheme.textSecondary }]}>
            {item.stores?.length || 0} brands
          </Text>
          <Text style={[styles.longPressHint, { color: currentTheme.textTertiary }]}>
            Long press for options
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color={currentTheme.textTertiary} />
      </View>
    </ScalableButton>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Collections</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
          Your curated brand libraries
        </Text>

        <View style={[styles.searchContainer, { backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}>
          <FontAwesome name="search" size={16} color={currentTheme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.text }]}
            placeholder="Search brand names..."
            placeholderTextColor={currentTheme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {searchQuery.trim() ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.brand.name}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <FontAwesome name="search" size={40} color={currentTheme.textTertiary} />
              <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                No brands found matching "{searchQuery}"
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollection}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="folder-open-o" size={48} color={currentTheme.textTertiary} />
              <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                No collections yet
              </Text>
              <Text style={[styles.emptySubtext, { color: currentTheme.textTertiary }]}>
                Import a CSV or JSON file to create your first collection
              </Text>
            </View>
          }
        />
      )}

      <ScalableButton
        style={[styles.fab, { backgroundColor: currentTheme.tint }]}
        onPress={handleCreateCollection}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </ScalableButton>

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Rename Collection</Text>
            <Text style={[styles.modalSubtitle, { color: currentTheme.textSecondary }]}>
              Current: {selectedCollection?.name}
            </Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: currentTheme.backgroundSecondary,
                color: currentTheme.text,
                borderColor: currentTheme.border
              }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Collection name"
              placeholderTextColor={currentTheme.textTertiary}
              autoFocus
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={styles.charCountRow}>
              <Text style={[styles.charCount, { color: newName.length >= 20 ? '#ff3b30' : currentTheme.textTertiary }]}>
                {newName.length}/20
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.backgroundTertiary }]}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.tint }]}
                onPress={handleRename}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  } as ViewStyle,
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  } as ViewStyle,
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 20,
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 15,
  } as ViewStyle,
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  } as TextStyle,
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  } as ViewStyle,
  card: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  } as ViewStyle,
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  } as ViewStyle,
  coverImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  } as ImageStyle,
  placeholderCover: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  cardInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  cardSubtitle: {
    fontSize: 14,
  } as TextStyle,
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  } as ViewStyle,
  sharedText: {
    fontSize: 11,
    fontWeight: '600',
  } as TextStyle,
  // Search Result Styles
  searchResult: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  } as ViewStyle,
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  } as ViewStyle,
  searchResultInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  brandName: {
    fontSize: 18,
    fontWeight: '700',
  } as TextStyle,
  collectionList: {
    fontSize: 13,
  } as TextStyle,
  removeDuplicateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  } as ViewStyle,
  removeDuplicateText: {
    fontSize: 12,
    fontWeight: '700',
  } as TextStyle,
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
    paddingHorizontal: 40,
  } as ViewStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
  longPressHint: {
    fontSize: 11,
    marginTop: 2,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  } as ViewStyle,
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  } as TextStyle,
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  } as TextStyle,
  modalInput: {
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 8,
  } as TextStyle,
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  } as ViewStyle,
  charCount: {
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  } as ViewStyle,
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
});
