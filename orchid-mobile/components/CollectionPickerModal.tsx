import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { ScalableButton } from '@/components/ui/ScalableButton';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';

// Generic type for items with id and name
interface PickableItem {
  id: string;
  name: string;
}

interface CollectionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  title: string;
  actionLabel: string;
  collections: PickableItem[];
  isDestructive?: boolean;
}

export const CollectionPickerModal: React.FC<CollectionPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  title,
  actionLabel,
  collections,
  isDestructive = false,
}) => {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      setSelectedId(null);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: currentTheme.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="close" size={24} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            Select a collection to proceed:
          </Text>

          <FlatList
            data={collections}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = selectedId === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    { backgroundColor: currentTheme.background, borderColor: isSelected ? currentTheme.tint : currentTheme.border },
                    isSelected && { borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedId(item.id)}
                >
                  <FontAwesome
                    name="folder"
                    size={20}
                    color={isSelected ? currentTheme.tint : currentTheme.textSecondary}
                  />
                  <Text style={[styles.itemText, { color: currentTheme.text }]}>{item.name}</Text>
                  {isSelected && (
                    <FontAwesome name="check-circle" size={20} color={currentTheme.tint} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.actions}>
            <ScalableButton
              style={[styles.button, { backgroundColor: currentTheme.background, borderColor: currentTheme.border, borderWidth: 1 }]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: currentTheme.text }]}>Cancel</Text>
            </ScalableButton>
            <ScalableButton
              style={[
                styles.button,
                { backgroundColor: isDestructive ? '#ff3b30' : currentTheme.tint },
                !selectedId && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedId}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>{actionLabel}</Text>
            </ScalableButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  } as ViewStyle,
  modal: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  title: {
    fontSize: 22,
    fontWeight: '700',
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  } as TextStyle,
  list: {
    maxHeight: 300,
  } as ViewStyle,
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  } as ViewStyle,
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  } as ViewStyle,
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  } as ViewStyle,
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  buttonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
});
