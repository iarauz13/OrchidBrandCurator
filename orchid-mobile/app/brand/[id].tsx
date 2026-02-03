import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Modal,
  TextInput,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useBinderStore } from '@/stores/useBinderStore';
import { StoreItem } from '@/types/models';
import { ScalableButton } from '@/components/ui/ScalableButton';

export default function BrandDetailScreen() {
  const { id, collectionId, binderId } = useLocalSearchParams<{
    id: string;
    collectionId?: string;
    binderId?: string;
  }>();

  const router = useRouter();
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { collections, updateStoreItem: updateCollectionItem } = useCollectionStore();
  const { binders, updateStoreItem: updateBinderItem } = useBinderStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<Partial<StoreItem>>({});

  // Find the store item in collections or binders
  const store = useMemo(() => {
    let foundStore: StoreItem | undefined;

    if (collectionId) {
      const col = collections.find(c => c.id === collectionId);
      foundStore = col?.stores?.find(s => s.id === id);
    }

    if (!foundStore && binderId) {
      const bin = binders.find(b => b.id === binderId);
      foundStore = bin?.items?.find(s => s.id === id);
    }

    // Fallback: search everywhere
    if (!foundStore) {
      for (const col of collections) {
        foundStore = col.stores?.find(s => s.id === id);
        if (foundStore) break;
      }
    }

    if (!foundStore) {
      for (const bin of binders) {
        foundStore = bin.items?.find(s => s.id === id);
        if (foundStore) break;
      }
    }

    return foundStore;
  }, [id, collectionId, binderId, collections, binders]);

  useEffect(() => {
    if (store) {
      setEditData({
        name: store.name,
        category: store.category,
        description: store.description,
        country: store.country,
        city: store.city,
        website: store.website,
        instagram: store.instagram,
        userNote: store.userNote,
        tags: store.tags || [],
      });
    }
  }, [store]);

  const handleSave = () => {
    if (!store) return;

    if (collectionId) {
      updateCollectionItem(collectionId, store.id, editData);
    } else if (binderId) {
      updateBinderItem(binderId, store.id, editData);
    } else {
      // If we don't have IDs, we search and update everywhere it exists
      collections.forEach(c => {
        if (c.stores?.some(s => s.id === store.id)) {
          updateCollectionItem(c.id, store.id, editData);
        }
      });
      binders.forEach(b => {
        if (b.items?.some(s => s.id === store.id)) {
          updateBinderItem(b.id, store.id, editData);
        }
      });
    }
    setEditModalVisible(false);
  };

  const handleRevert = () => {
    if (!store) return;
    setEditData({
      name: store.name,
      category: store.category,
      description: store.description,
      country: store.country,
      city: store.city,
      website: store.website,
      instagram: store.instagram,
      userNote: store.userNote,
      tags: store.tags || [],
    });
  };

  const handleOpenLink = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  const handleOpenInstagram = (username?: string) => {
    if (username) {
      const cleanUsername = username.replace('@', '');
      const url = `instagram://user?username=${cleanUsername}`;
      const webUrl = `https://instagram.com/${cleanUsername}`;

      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(webUrl);
        }
      });
    }
  };

  if (!store) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Stack.Screen options={{ title: 'Brand Details' }} />
        <View style={styles.center}>
          <Text style={{ color: currentTheme.textSecondary }}>Brand not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen
        options={{
          title: store.name,
          headerTransparent: true,
          headerTintColor: currentTheme.tint,
          headerRight: () => (
            <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.headerEditButton}>
              <FontAwesome name="pencil" size={20} color={currentTheme.tint} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Visual */}
        <View style={[styles.visualHeader, { backgroundColor: currentTheme.backgroundSecondary }]}>
          {store.logoUrl ? (
            <Image source={{ uri: store.logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: currentTheme.backgroundTertiary }]}>
              <Text style={[styles.logoInitial, { color: currentTheme.textSecondary }]}>
                {store.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Main Info */}
          <Text style={[styles.name, { color: currentTheme.text }]}>{store.name}</Text>
          <Text style={[styles.category, { color: currentTheme.tint }]}>{store.category}</Text>

          {(store.city || store.country) && (
            <View style={styles.locationRow}>
              <FontAwesome name="map-marker" size={14} color={currentTheme.textSecondary} />
              <Text style={[styles.locationText, { color: currentTheme.textSecondary }]}>
                {[store.city, store.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Tags */}
          {store.tags && store.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {store.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: currentTheme.backgroundTertiary }]}>
                  <Text style={[styles.tagText, { color: currentTheme.textSecondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Links Section */}
          <View style={styles.linksRow}>
            {store.website && (
              <ScalableButton
                style={[styles.linkButton, { backgroundColor: currentTheme.card }]}
                onPress={() => handleOpenLink(store.website)}
              >
                <FontAwesome name="globe" size={18} color={currentTheme.text} />
                <Text style={[styles.linkButtonText, { color: currentTheme.text }]}>Website</Text>
              </ScalableButton>
            )}
            {store.instagram && (
              <ScalableButton
                style={[styles.linkButton, { backgroundColor: currentTheme.card }]}
                onPress={() => handleOpenInstagram(store.instagram)}
              >
                <FontAwesome name="instagram" size={18} color={currentTheme.text} />
                <Text style={[styles.linkButtonText, { color: currentTheme.text }]}>Instagram</Text>
              </ScalableButton>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          {store.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentTheme.textTertiary }]}>ABOUT</Text>
              <Text style={[styles.description, { color: currentTheme.text }]}>{store.description}</Text>
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.textTertiary }]}>PERSONAL NOTES</Text>
            <View style={[styles.notesCard, { backgroundColor: currentTheme.backgroundSecondary }]}>
              <Text style={[styles.notesText, { color: currentTheme.text }]}>
                {store.userNote || 'No personal notes added yet.'}
              </Text>
              <TouchableOpacity
                style={styles.editNotesButton}
                onPress={() => setEditModalVisible(true)}
              >
                <FontAwesome name="pencil" size={14} color={currentTheme.tint} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Edit Brand</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <FontAwesome name="close" size={20} color={currentTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>Brand Name</Text>
                <TextInput
                  style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}
                  value={editData.name}
                  onChangeText={(val) => setEditData({ ...editData, name: val })}
                  placeholder="Brand name"
                  placeholderTextColor={currentTheme.textTertiary}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>City</Text>
                  <TextInput
                    style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}
                    value={editData.city}
                    onChangeText={(val) => setEditData({ ...editData, city: val })}
                    placeholder="Stockholm"
                    placeholderTextColor={currentTheme.textTertiary}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>Country</Text>
                  <TextInput
                    style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}
                    value={editData.country}
                    onChangeText={(val) => setEditData({ ...editData, country: val })}
                    placeholder="Sweden"
                    placeholderTextColor={currentTheme.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>Website URL</Text>
                <TextInput
                  style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}
                  value={editData.website}
                  onChangeText={(val) => setEditData({ ...editData, website: val })}
                  placeholder="https://..."
                  placeholderTextColor={currentTheme.textTertiary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>Instagram Handle</Text>
                <TextInput
                  style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}
                  value={editData.instagram}
                  onChangeText={(val) => setEditData({ ...editData, instagram: val })}
                  placeholder="@handle"
                  placeholderTextColor={currentTheme.textTertiary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}
                  value={editData.description}
                  onChangeText={(val) => setEditData({ ...editData, description: val })}
                  placeholder="About the brand..."
                  placeholderTextColor={currentTheme.textTertiary}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>Personal Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}
                  value={editData.userNote}
                  onChangeText={(val) => setEditData({ ...editData, userNote: val })}
                  placeholder="Your private notes..."
                  placeholderTextColor={currentTheme.textTertiary}
                  multiline
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: currentTheme.tint }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.revertButton, { marginTop: 12 }]}
                  onPress={handleRevert}
                >
                  <Text style={[styles.revertButtonText, { color: currentTheme.textSecondary }]}>Revert Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualHeader: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 48,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    backgroundColor: 'inherit',
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.1)',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  notesCard: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  editNotesButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  headerEditButton: {
    marginRight: 15,
    padding: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalButtons: {
    marginTop: 10,
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  revertButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revertButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
