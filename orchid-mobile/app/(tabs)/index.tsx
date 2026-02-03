import { StyleSheet, View, Text, FlatList, Pressable, Image, ActionSheetIOS, Alert, Platform, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useBinderStore } from '@/stores/useBinderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import EmptyState from '@/components/EmptyState';
import { ScalableButton } from '@/components/ui/ScalableButton';
import { useState } from 'react';
import { Binder } from '@/types/models';

export default function HomeScreen() {
  const { binders, isLoading, removeBinder, renameBinder } = useBinderStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { theme } = useUIStore();
  const colorScheme = useColorScheme() ?? 'light';
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedBinder, setSelectedBinder] = useState<Binder | null>(null);
  const [newName, setNewName] = useState('');

  if (!user) return null;

  const handleBinderPress = (binder: Binder) => {
    router.push(`/binder/${binder.id}`);
  };

  const handleBinderLongPress = (binder: Binder) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Rename Folio', 'Remove Folio'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: binder.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Rename
            setSelectedBinder(binder);
            setNewName(binder.name);
            setRenameModalVisible(true);
          } else if (buttonIndex === 2) {
            // Remove
            confirmRemoveBinder(binder);
          }
        }
      );
    } else {
      Alert.alert(
        binder.name,
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Rename Folio',
            onPress: () => {
              setSelectedBinder(binder);
              setNewName(binder.name);
              setRenameModalVisible(true);
            },
          },
          {
            text: 'Remove Folio',
            style: 'destructive',
            onPress: () => confirmRemoveBinder(binder),
          },
        ]
      );
    }
  };

  const confirmRemoveBinder = (binder: Binder) => {
    Alert.alert(
      'Remove Folio',
      `Are you sure you want to permanently delete "${binder.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeBinder(binder.id),
        },
      ]
    );
  };

  const handleRename = () => {
    if (selectedBinder && newName.trim()) {
      renameBinder(selectedBinder.id, newName.trim());
      setRenameModalVisible(false);
      setSelectedBinder(null);
      setNewName('');
    }
  };

  const renderBinderCard = ({ item, index }: { item: Binder, index: number }) => (
    <ScalableButton
      scaleTo={0.96}
      style={[styles.folioCard, { backgroundColor: currentTheme.card }]}
      onPress={() => handleBinderPress(item)}
      onLongPress={() => handleBinderLongPress(item)}
      delayLongPress={400}
    >
      {/* Cover Image Area */}
      <View style={styles.coverContainer}>
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: currentTheme.backgroundSecondary }]}>
            <FontAwesome name="book" size={40} color={currentTheme.textTertiary} />
          </View>
        )}

        {/* Overlay Gradient/Badge */}
        <View style={styles.cardOverlay}>
          {item.isShared && (
            <View style={styles.sharedBadge}>
              <FontAwesome name="users" size={10} color="#fff" />
              <Text style={styles.sharedText}>SHARED</Text>
            </View>
          )}
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: currentTheme.text }]}>{item.name}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.cardSubtitle, { color: currentTheme.textSecondary }]}>
            {item.items?.length || 0} Brands
          </Text>
          <Text style={[styles.cardSubtitle, { color: currentTheme.textSecondary }]}>•</Text>
          <Text style={[styles.cardSubtitle, { color: currentTheme.textSecondary }]}>
            {item.isShared ? 'Collaborative' : 'Private'}
          </Text>
        </View>
        <Text style={[styles.longPressHint, { color: currentTheme.textTertiary }]}>
          Long press for options
        </Text>
      </View>
    </ScalableButton>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: currentTheme.textSecondary }]}>MY LIBRARY</Text>
          <Text style={[styles.title, { color: currentTheme.text }]}>Folios</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Link href="/scan" asChild>
            <ScalableButton style={[styles.iconButton, { backgroundColor: currentTheme.card }]}>
              <FontAwesome name="qrcode" size={18} color={currentTheme.text} />
            </ScalableButton>
          </Link>
          <Link href="/modal" asChild>
            <ScalableButton style={[styles.iconButton, { backgroundColor: currentTheme.tint }]}>
              <FontAwesome name="plus" size={18} color={currentTheme.textInverse} />
            </ScalableButton>
          </Link>
        </View>
      </View>

      {isLoading && binders.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: currentTheme.textSecondary }}>Syncing Library...</Text>
        </View>
      ) : binders.length === 0 ? (
        <EmptyState
          title="No Folios Created"
          description="Start your curation journey by creating your first folio."
          actionLabel="Create Folio"
          onAction={() => router.push('/modal')}
          icon="book-outline"
        />
      ) : (
        <FlatList
          data={binders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderBinderCard}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Rename Folio</Text>
            <Text style={[styles.modalSubtitle, { color: currentTheme.textSecondary }]}>
              Current: {selectedBinder?.name}
            </Text>
            <TextInput
              style={[styles.modalInput, {
                color: currentTheme.text,
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.backgroundSecondary
              }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '300', // Premium light weight
    fontFamily: 'System', // Ideally 'SpaceMono' or custom font
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    gap: 24,
    paddingBottom: 40,
  },
  folioCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  coverContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    backdropFilter: 'blur(10px)', // iOS only
  },
  sharedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
    paddingTop: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  longPressHint: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
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
