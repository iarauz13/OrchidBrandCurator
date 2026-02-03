import React, { useEffect, useState } from 'react';
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
  const { collections, setActiveCollection, loadSampleCollections, removeCollection, clearCollection, renameCollection } = useCollectionStore();
  const router = useRouter();

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [newName, setNewName] = useState('');

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
      </View>

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
