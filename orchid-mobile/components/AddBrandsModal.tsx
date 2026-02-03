import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ScrollView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { StoreItem, Collection } from '@/types/models';
import { ScalableButton } from '@/components/ui/ScalableButton';

interface AddBrandsModalProps {
  visible: boolean;
  binderId: string;
  onClose: () => void;
  onAdd: (items: StoreItem[]) => void;
}

const MAX_SELECTION = 15;

export const AddBrandsModal: React.FC<AddBrandsModalProps> = ({
  visible,
  binderId,
  onClose,
  onAdd,
}) => {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { collections } = useCollectionStore();

  const [step, setStep] = useState<'collection' | 'brands'>('collection');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedItems, setSelectedItems] = useState<StoreItem[]>([]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setStep('collection');
      setSelectedCollection(null);
      setSelectedItems([]);
    }
  }, [visible]);

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setStep('brands');
  };

  const handleToggleItem = (item: StoreItem) => {
    const isSelected = selectedItems.some((i) => i.id === item.id);

    if (isSelected) {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      if (selectedItems.length >= MAX_SELECTION) {
        Alert.alert(
          'Selection Limit',
          `You can only select up to ${MAX_SELECTION} brands at a time. Please add these first, then select more.`,
          [{ text: 'OK' }]
        );
        return;
      }
      setSelectedItems((prev) => [...prev, item]);
    }
  };

  const handleAddBrands = () => {
    if (selectedItems.length === 0) return;
    onAdd(selectedItems);
  };

  const renderCollectionItem = ({ item }: { item: Collection }) => (
    <ScalableButton
      style={[styles.collectionRow, { borderBottomColor: currentTheme.border }]}
      onPress={() => handleSelectCollection(item)}
    >
      <View style={styles.collectionContent}>
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.collectionImage} />
        ) : (
          <View style={[styles.collectionPlaceholder, { backgroundColor: currentTheme.backgroundTertiary }]}>
            <FontAwesome name="folder-open" size={24} color={currentTheme.textTertiary} />
          </View>
        )}
        <View style={styles.collectionInfo}>
          <Text style={[styles.collectionName, { color: currentTheme.text }]}>{item.name}</Text>
          <Text style={[styles.collectionCount, { color: currentTheme.textSecondary }]}>
            {item.stores?.length || 0} brands
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} />
      </View>
    </ScalableButton>
  );

  const renderBrandItem = ({ item }: { item: StoreItem }) => {
    const isSelected = selectedItems.some((i) => i.id === item.id);

    return (
      <ScalableButton
        style={[
          styles.brandRow,
          { borderBottomColor: currentTheme.border },
          isSelected && { backgroundColor: currentTheme.tint + '15' },
        ]}
        onPress={() => handleToggleItem(item)}
        onLongPress={() => handleToggleItem(item)}
        delayLongPress={200}
      >
        <View style={styles.brandContent}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={styles.brandLogo} />
          ) : (
            <View style={[styles.brandLogoPlaceholder, { backgroundColor: currentTheme.backgroundTertiary }]}>
              <Text style={[styles.brandInitial, { color: currentTheme.textSecondary }]}>
                {item.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.brandInfo}>
            <Text style={[styles.brandName, { color: currentTheme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.category && (
              <Text style={[styles.brandCategory, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                {item.category}
              </Text>
            )}
          </View>
          <View style={[
            styles.checkbox,
            { borderColor: currentTheme.border },
            isSelected && { backgroundColor: currentTheme.tint, borderColor: currentTheme.tint },
          ]}>
            {isSelected && <FontAwesome name="check" size={12} color="#fff" />}
          </View>
        </View>
      </ScalableButton>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={step === 'brands' ? () => setStep('collection') : onClose} style={styles.headerButton}>
            <FontAwesome
              name={step === 'brands' ? 'chevron-left' : 'times'}
              size={20}
              color={currentTheme.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
            {step === 'collection' ? 'Select Collection' : 'Select Brands'}
          </Text>
          <View style={styles.headerButton} />
        </View>

        {step === 'collection' ? (
          <>
            {/* Info message */}
            <View style={[styles.infoBox, { backgroundColor: currentTheme.tint + '15' }]}>
              <FontAwesome name="info-circle" size={16} color={currentTheme.tint} />
              <Text style={[styles.infoText, { color: currentTheme.text }]}>
                Brands can only be added from your Collections. Select a collection to browse brands.
              </Text>
            </View>

            {/* Collection list */}
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id}
              renderItem={renderCollectionItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <FontAwesome name="folder-open-o" size={48} color={currentTheme.textTertiary} />
                  <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                    No collections yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: currentTheme.textTertiary }]}>
                    Import a CSV to create a collection first
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <>
            {/* Selection counter */}
            <View style={[styles.selectionBar, { backgroundColor: currentTheme.backgroundSecondary }]}>
              <Text style={[styles.selectionText, { color: currentTheme.text }]}>
                {selectedItems.length}/{MAX_SELECTION} selected
              </Text>
              {selectedItems.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedItems([])}>
                  <Text style={[styles.clearText, { color: currentTheme.tint }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Brands list */}
            <FlatList
              data={selectedCollection?.stores || []}
              keyExtractor={(item) => item.id}
              renderItem={renderBrandItem}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <Text style={[styles.listHeader, { color: currentTheme.textSecondary }]}>
                  Long-press or tap to select brands
                </Text>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <FontAwesome name="inbox" size={48} color={currentTheme.textTertiary} />
                  <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                    No brands in this collection
                  </Text>
                </View>
              }
            />

            {/* Add button */}
            <View style={[styles.footer, { backgroundColor: currentTheme.background, borderTopColor: currentTheme.border }]}>
              <ScalableButton
                style={[
                  styles.addButton,
                  { backgroundColor: selectedItems.length > 0 ? currentTheme.tint : currentTheme.backgroundTertiary },
                ]}
                onPress={handleAddBrands}
                disabled={selectedItems.length === 0}
              >
                <Text style={[
                  styles.addButtonText,
                  { color: selectedItems.length > 0 ? '#fff' : currentTheme.textTertiary },
                ]}>
                  Add {selectedItems.length > 0 ? `${selectedItems.length} Brand${selectedItems.length > 1 ? 's' : ''}` : 'to Binder'}
                </Text>
              </ScalableButton>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  } as ViewStyle,
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  } as ViewStyle,
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  listContent: {
    paddingBottom: 100,
  } as ViewStyle,
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
  } as TextStyle,
  // Collection list styles
  collectionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } as ViewStyle,
  collectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  collectionImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  } as ImageStyle,
  collectionPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  collectionInfo: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  collectionName: {
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  collectionCount: {
    fontSize: 13,
  } as TextStyle,
  // Brand list styles
  brandRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } as ViewStyle,
  brandContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  } as ImageStyle,
  brandLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  brandInitial: {
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  brandInfo: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  brandName: {
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  brandCategory: {
    fontSize: 13,
  } as TextStyle,
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  // Selection bar
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  } as ViewStyle,
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  } as ViewStyle,
  addButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  } as ViewStyle,
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  // Empty state
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
});
