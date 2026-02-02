import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { parseImportFile, normalizeData, generateSmartMapping } from '../utils/importUtils';
import { useBinderStore } from '@/stores/useBinderStore';
import { FIREBASE_DB } from '@/config/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface MobileImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MobileImportModal({ visible, onClose }: MobileImportModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { binders, isLoading: bindersLoading } = useBinderStore();

  const [selectedBinderId, setSelectedBinderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const pickFile = async () => {
    if (binders.length === 0) {
      Alert.alert("No Binders", "Please create a binder first to import data into.");
      return;
    }

    if (!selectedBinderId) {
      // Default to first binder if not selected
      setSelectedBinderId(binders[0].id);
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json', 'text/plain'], // text/plain often used for csv on mobile
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const fileAsset = result.assets[0];
      setLoading(true);
      setStatus('Reading file...');

      const content = await FileSystem.readAsStringAsync(fileAsset.uri);

      setStatus('Parsing data...');
      const parseResult = await parseImportFile(content, fileAsset.name);

      if (parseResult.rows.length === 0) {
        Alert.alert("Empty File", "No data found in this file.");
        setLoading(false);
        return;
      }

      setStatus('Mapping & Justifying...');
      const mapping = generateSmartMapping(parseResult.headers);
      const stores = normalizeData(parseResult.rows, mapping);

      if (stores.length === 0) {
        Alert.alert("Import Failed", "Could not identify any valid stores. Check your CSV headers.");
        setLoading(false);
        return;
      }

      setStatus(`Importing ${stores.length} stores...`);
      await saveToBinder(stores, selectedBinderId || binders[0].id);

    } catch (error: any) {
      console.error(error);
      Alert.alert("Import Error", error.message);
      setLoading(false);
    }
  };

  const saveToBinder = async (stores: any[], binderId: string) => {
    try {
      const binderRef = doc(FIREBASE_DB, 'collections', binderId);

      // Batch writes using arrayUnion might hit limits if CSV is huge (>500 items).
      // For mobile MVP, we assume small personal imports (<100).
      // Ideally we chunk this, but arrayUnion is atomic.

      await updateDoc(binderRef, {
        stores: arrayUnion(...stores)
      });

      Alert.alert(
        "Success!",
        `Imported ${stores.length} brands into your binder.`,
        [{ text: "Great", onPress: onClose }]
      );
    } catch (e: any) {
      console.error("Save failed", e);
      Alert.alert("Save Failed", "Could not update the binder. " + e.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Import Registry</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.tint} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={[styles.info, { color: colors.textSecondary }]}>
              Import CSV or JSON files from other apps.
              We will automatically Format, Clean, and Categorize your brands.
            </Text>

            <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>Target Binder:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.binderScroll}>
              {binders.map(b => (
                <Pressable
                  key={b.id}
                  style={[
                    styles.binderChip,
                    { borderColor: selectedBinderId === b.id ? colors.tint : colors.textSecondary + '40' },
                    selectedBinderId === b.id && { backgroundColor: colors.tint + '10' }
                  ]}
                  onPress={() => setSelectedBinderId(b.id)}
                >
                  <Text style={{ color: selectedBinderId === b.id ? colors.tint : colors.text }}>{b.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{status}</Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.importButton, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
              onPress={pickFile}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.importBtnText}>Select File</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Verdana' // Trying to match web brand
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
  },
  info: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  label: {
    fontWeight: '600',
    marginBottom: 12,
  },
  binderScroll: {
    maxHeight: 50,
  },
  binderChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  importBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  }
});
