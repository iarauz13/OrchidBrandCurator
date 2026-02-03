import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, FlatList, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScalableButton } from './ui/ScalableButton';
import { useBinderStore } from '@/stores/useBinderStore';
import { useCollectionStore } from '@/stores/useCollectionStore';

interface ShareResourceModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (type: 'store' | 'collection' | 'binder', data: any) => void;
}

export default function ShareResourceModal({ visible, onClose, onShare }: ShareResourceModalProps) {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { binders } = useBinderStore();
  const { collections } = useCollectionStore();

  const [tab, setTab] = useState<'store' | 'collection' | 'binder'>('store');

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemCard, { borderBottomColor: currentTheme.border }]}
      onPress={() => onShare(tab, item)}
    >
      <View style={styles.itemInfo}>
        <FontAwesome
          name={tab === 'store' ? 'shopping-bag' : tab === 'collection' ? 'folder' : 'book'}
          size={18}
          color={currentTheme.textSecondary}
        />
        <Text style={[styles.itemName, { color: currentTheme.text }]}>{item.name}</Text>
      </View>
      <FontAwesome name="share" size={16} color={currentTheme.tint} />
    </TouchableOpacity>
  );

  const getData = () => {
    if (tab === 'binder') return binders;
    if (tab === 'collection') return collections;
    // For stores, we'll just show stores from the active collection for simplicity in MVP
    const activeCol = collections.find(c => c.stores && c.stores.length > 0);
    return activeCol ? activeCol.stores : [];
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: currentTheme.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>Share to Chat</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="close" size={20} color={currentTheme.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {(['store', 'collection', 'binder'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && { borderBottomColor: currentTheme.tint, borderBottomWidth: 2 }]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, { color: tab === t ? currentTheme.tint : currentTheme.textSecondary }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={getData()}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ color: currentTheme.textTertiary }}>No {tab}s found to share.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  }
});
