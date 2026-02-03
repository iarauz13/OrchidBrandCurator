import { StyleSheet, View, Text, ScrollView, Switch, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { ScalableButton } from '@/components/ui/ScalableButton';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useBinderStore } from '@/stores/useBinderStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { ActionRow } from '@/components/ActionRow';
import { CollectionPickerModal } from '@/components/CollectionPickerModal';
import { ImportModal } from '@/components/ImportModal';
import { StoreItem } from '@/types/models';

export default function ProfileScreen() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  // Binders for sub-groupings
  const { binders, clearBinder, removeBinder, loadSampleData } = useBinderStore();

  // Collections for CSV imports
  const { collections, activeCollectionId, importItems, clearCollection, removeCollection, loadSampleCollections, renameCollection } = useCollectionStore();

  const [mascotEnabled, setMascotEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Modal states
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameModalInnerVisible, setRenameModalInnerVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Load sample collections on first mount if empty
  useEffect(() => {
    if (collections.length === 0) {
      loadSampleCollections();
    }
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => setUser(null) }
      ]
    );
  };

  const handleOpenImport = (mode: 'replace' | 'append') => {
    setImportMode(mode);
    setImportModalVisible(true);
  };

  const handleImportComplete = (items: StoreItem[], collectionId: string) => {
    importItems(collectionId, items, importMode);
    Alert.alert(
      "Import Complete",
      `Successfully imported ${items.length} items!`
    );
  };

  const handleLoadSampleData = () => {
    loadSampleCollections();
    Alert.alert("Success", "Sample collections have been loaded!");
  };

  const handleClearCollection = (collectionId: string) => {
    clearCollection(collectionId);
    setClearModalVisible(false);
    Alert.alert("Success", "Collection has been cleared!");
  };

  const handleRemoveCollection = (collectionId: string) => {
    const collectionName = collections.find(c => c.id === collectionId)?.name;
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to permanently delete "${collectionName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeCollection(collectionId);
            setRemoveModalVisible(false);
            Alert.alert("Deleted", "Collection has been permanently removed.");
          }
        }
      ]
    );
  };

  const handleRename = () => {
    if (selectedId && newName.trim()) {
      renameCollection(selectedId, newName.trim());
      setRenameModalInnerVisible(false);
      setSelectedId(null);
      setNewName('');
    }
  };

  const themes = [
    { id: 'light', label: 'Light', color: '#ffffff', border: '#e5e5ea' },
    { id: 'dark', label: 'Dark', color: '#000000', border: '#333' },
    { id: 'champagne', label: 'Champagne', color: '#F9F4F0', border: '#d7ccc8' },
    { id: 'midnight', label: 'Midnight', color: '#0f172a', border: '#1e293b' },
    { id: 'botanical', label: 'Botanical', color: '#064e3b', border: '#065f46' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { borderColor: currentTheme.border }]}>
            <View style={[styles.avatar, { backgroundColor: currentTheme.tint }]}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'G'}
              </Text>
            </View>
          </View>
          <Text style={[styles.email, { color: currentTheme.text }]}>{user?.email}</Text>
          <Text style={[styles.status, { color: currentTheme.textSecondary }]}>
            {user?.uid.includes('guest') ? 'Guest Curator' : 'Pro Member'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: currentTheme.textSecondary }]}>APPEARANCE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeSelector}>
            {themes.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTheme(t.id as any)}
                style={[
                  styles.themeOption,
                  { borderColor: theme === t.id ? currentTheme.tint : 'transparent', backgroundColor: currentTheme.card }
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: t.color, borderColor: t.border, borderWidth: 1 }]} />
                <Text style={[styles.themeLabel, { color: theme === t.id ? currentTheme.tint : currentTheme.textSecondary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: currentTheme.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: currentTheme.border }]}>
              <View style={styles.rowLabel}>
                <FontAwesome name="smile-o" size={20} color={currentTheme.text} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: currentTheme.text }]}>Curator Mascot</Text>
              </View>
              <Switch value={mascotEnabled} onValueChange={setMascotEnabled} trackColor={{ false: '#767577', true: currentTheme.tint }} />
            </View>
            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <FontAwesome name="bolt" size={20} color={currentTheme.text} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: currentTheme.text }]}>Haptic Feedback</Text>
              </View>
              <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={{ false: '#767577', true: currentTheme.tint }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: currentTheme.textSecondary }]}>DATA MANAGEMENT</Text>
          <View style={styles.actionList}>
            <ActionRow icon="upload" title="Import from CSV/JSON" description="Replace current collection with file data" onPress={() => handleOpenImport('replace')} />
            <ActionRow icon="plus-square" title="Append from CSV/JSON" description="Add items from file to your collection" onPress={() => handleOpenImport('append')} />
            <ActionRow icon="database" title="Load Sample Data" description="Explore with sample fashion brands" onPress={handleLoadSampleData} />
            <ActionRow icon="edit" title="Rename Collection" description="Change a collection's name" onPress={() => setRenameModalVisible(true)} />
            <ActionRow icon="eraser" title="Clear Collection" description="Remove all items from a collection" onPress={() => setClearModalVisible(true)} isDestructive />
            <ActionRow icon="trash" title="Remove Collection" description="Permanently delete a collection" onPress={() => setRemoveModalVisible(true)} isDestructive />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: currentTheme.textSecondary }]}>SUPPORT</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
            <ScalableButton style={styles.actionRow} onPress={() => Alert.alert("Contact Support", "Email us at support@orchid.app")}>
              <View style={styles.rowLabel}>
                <FontAwesome name="envelope-o" size={18} color={currentTheme.text} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: currentTheme.text }]}>Contact Us</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} />
            </ScalableButton>
          </View>
        </View>

        <View style={styles.section}>
          <ScalableButton style={[styles.button, { backgroundColor: currentTheme.card }]} onPress={handleSignOut}>
            <Text style={[styles.buttonText, { color: '#ff3b30' }]}>Sign Out</Text>
          </ScalableButton>
          <Text style={[styles.version, { color: currentTheme.textTertiary }]}>Agave Version 1.0.0 (Build 442)</Text>
        </View>
      </ScrollView>

      <CollectionPickerModal
        visible={clearModalVisible}
        onClose={() => setClearModalVisible(false)}
        onSelect={handleClearCollection}
        title="Clear Collection"
        actionLabel="Clear All Items"
        collections={collections}
        isDestructive
      />

      <CollectionPickerModal
        visible={removeModalVisible}
        onClose={() => setRemoveModalVisible(false)}
        onSelect={handleRemoveCollection}
        title="Remove Collection"
        actionLabel="Delete Collection"
        collections={collections}
        isDestructive
      />

      <ImportModal
        visible={importModalVisible}
        mode={importMode}
        onClose={() => setImportModalVisible(false)}
        onComplete={handleImportComplete}
        collections={collections}
        activeCollectionId={activeCollectionId}
      />

      <CollectionPickerModal
        visible={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
        onSelect={(id) => {
          setSelectedId(id);
          setNewName(collections.find(c => c.id === id)?.name || '');
          setRenameModalVisible(false);
          // Small delay to let first modal close before opening second
          setTimeout(() => setRenameModalInnerVisible(true), 100);
        }}
        title="Rename Collection"
        actionLabel="Select to Rename"
        collections={collections}
      />

      <Modal
        visible={renameModalInnerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalInnerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Rename Collection</Text>
            <Text style={[styles.modalSubtitle, { color: currentTheme.textSecondary }]}>
              Current: {collections.find(c => c.id === selectedId)?.name}
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
                onPress={() => setRenameModalInnerVisible(false)}
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
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 50,
    borderWidth: 1,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowIcon: {
    width: 24,
    textAlign: 'center',
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
  themeSelector: {
    gap: 12,
    paddingRight: 20,
  },
  themeOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionList: {
    gap: 8,
  },
  // Rename Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
