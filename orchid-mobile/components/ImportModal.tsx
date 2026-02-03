import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Alert, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ScalableButton } from '@/components/ui/ScalableButton';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { Collection, StoreItem } from '@/types/models';
import * as DocumentPicker from 'expo-document-picker';
import {
  parseImportFile,
  generateSmartMapping,
  normalizeData,
  COLUMN_ALIASES,
  FileData,
  FieldMapping
} from '@/utils/importUtils';

// Helper to read file content from URI
const readFileContent = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const text = await response.text();
  return text;
};

type ImportStep = 'upload' | 'mapping' | 'processing';

interface ImportModalProps {
  visible: boolean;
  mode: 'replace' | 'append';
  onClose: () => void;
  onComplete: (items: StoreItem[], collectionId: string) => void;
  collections: Collection[];
  activeCollectionId: string | null;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  mode,
  onClose,
  onComplete,
  collections,
  activeCollectionId,
}) => {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(activeCollectionId);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<FileData | null>(null);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (visible) {
      resetState();
      setSelectedCollectionId(activeCollectionId || (collections.length > 0 ? collections[0].id : null));
    }
  }, [visible, activeCollectionId, collections]);

  const resetState = () => {
    setStep('upload');
    setFileName(null);
    setRawFile(null);
    setMapping({});
    setError('');
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const isCsv = file.mimeType?.includes('csv') || file.name.endsWith('.csv');
        const isJson = file.mimeType?.includes('json') || file.name.endsWith('.json');

        if (!isCsv && !isJson) {
          setError('Please select a CSV or JSON file.');
          return;
        }

        setFileName(file.name);
        setError('');

        // Parse the file
        const content = await readFileContent(file.uri);
        const data = await parseImportFile(content, file.name);
        setRawFile(data);

        // Generate initial smart mapping
        const initialMapping = generateSmartMapping(data.headers);
        setMapping(initialMapping);

        setStep('mapping');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to pick file');
    }
  };

  const handleImport = () => {
    if (!rawFile || !selectedCollectionId) return;

    setStep('processing');

    setTimeout(() => {
      try {
        const items = normalizeData(rawFile.rows, mapping);
        if (items.length === 0) {
          setError('No valid items found with current mapping. Please check your column assignments.');
          setStep('mapping');
          return;
        }

        onComplete(items, selectedCollectionId);
        onClose();
      } catch (err: any) {
        setError(err.message);
        setStep('mapping');
      }
    }, 500);
  };

  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const hasRequiredFields = mapping.store_name || mapping.website;

  const schemaFields = Object.keys(COLUMN_ALIASES);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {mode === 'replace' ? 'Import Data' : 'Append Data'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {step === 'processing' ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={currentTheme.tint} />
            <Text style={[styles.processingText, { color: currentTheme.text }]}>Importing...</Text>
            <Text style={[styles.processingSubtext, { color: currentTheme.textSecondary }]}>
              Processing {rawFile?.rows.length || 0} items
            </Text>
          </View>
        ) : step === 'upload' ? (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Collection Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: currentTheme.textSecondary }]}>TARGET COLLECTION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionScroll}>
                {collections.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCollectionId(c.id)}
                    style={[
                      styles.collectionChip,
                      {
                        backgroundColor: selectedCollectionId === c.id ? currentTheme.tint : currentTheme.card,
                        borderColor: selectedCollectionId === c.id ? currentTheme.tint : currentTheme.border,
                      }
                    ]}
                  >
                    <FontAwesome
                      name="folder"
                      size={14}
                      color={selectedCollectionId === c.id ? '#fff' : currentTheme.textSecondary}
                    />
                    <Text style={[
                      styles.collectionChipText,
                      { color: selectedCollectionId === c.id ? '#fff' : currentTheme.text }
                    ]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Upload Area */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: currentTheme.textSecondary }]}>SELECT FILE</Text>
              <ScalableButton
                style={[styles.uploadArea, { borderColor: currentTheme.border, backgroundColor: currentTheme.card }]}
                onPress={handlePickFile}
              >
                <FontAwesome name="cloud-upload" size={40} color={currentTheme.tint} />
                <Text style={[styles.uploadText, { color: currentTheme.text }]}>
                  {fileName || 'Tap to select CSV or JSON'}
                </Text>
                <Text style={[styles.uploadHint, { color: currentTheme.textSecondary }]}>
                  Supports CSV and JSON formats
                </Text>
              </ScalableButton>
            </View>

            {/* Smart Import Guide */}
            <View style={[styles.guideCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
              <Text style={[styles.guideTitle, { color: currentTheme.text }]}>Smart Import Guide</Text>
              <Text style={[styles.guideText, { color: currentTheme.textSecondary }]}>
                We'll auto-detect common column names like:
              </Text>
              <View style={styles.guideGrid}>
                {schemaFields.slice(0, 4).map((field) => (
                  <View key={field} style={styles.guideItem}>
                    <Text style={[styles.guideField, { color: currentTheme.text }]}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </Text>
                    <Text style={[styles.guideAliases, { color: currentTheme.textTertiary }]}>
                      {COLUMN_ALIASES[field].slice(0, 2).join(', ')}...
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: '#ffebee' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          /* Mapping Step */
          <View style={styles.mappingContainer}>
            <View style={styles.mappingHeader}>
              <Text style={[styles.mappingTitle, { color: currentTheme.text }]}>Map Columns</Text>
              <Text style={[styles.mappingSubtitle, { color: currentTheme.textSecondary }]}>
                Match columns from <Text style={{ fontWeight: '700' }}>{fileName}</Text>
              </Text>
            </View>

            <ScrollView style={styles.mappingList}>
              {schemaFields.map((field) => (
                <View key={field} style={[styles.mappingRow, { borderBottomColor: currentTheme.border }]}>
                  <View style={styles.mappingFieldInfo}>
                    <Text style={[styles.mappingFieldName, { color: currentTheme.text }]}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </Text>
                    {(field === 'store_name' || field === 'website') && (
                      <Text style={styles.requiredBadge}>Required</Text>
                    )}
                  </View>
                  <View style={[styles.pickerContainer, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => {
                        Alert.alert(
                          `Select column for "${field}"`,
                          undefined,
                          [
                            { text: '-- None --', onPress: () => setMapping({ ...mapping, [field]: '' }) },
                            ...(rawFile?.headers || []).map((h) => ({
                              text: h,
                              onPress: () => setMapping({ ...mapping, [field]: h }),
                            })),
                          ]
                        );
                      }}
                    >
                      <Text style={[styles.pickerText, { color: mapping[field] ? currentTheme.text : currentTheme.textTertiary }]}>
                        {mapping[field] || 'Select column...'}
                      </Text>
                      <FontAwesome name="chevron-down" size={12} color={currentTheme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.mappingFooter, { borderTopColor: currentTheme.border, backgroundColor: currentTheme.background }]}>
              <View style={styles.statsRow}>
                <Text style={[styles.statsText, { color: currentTheme.textSecondary }]}>
                  {rawFile?.rows.length || 0} records found
                </Text>
                <Text style={[
                  styles.statsText,
                  { color: mappedCount >= 2 ? '#4caf50' : '#ff9800' }
                ]}>
                  {mappedCount} columns mapped
                </Text>
              </View>

              {error && (
                <Text style={[styles.mappingError, { color: '#f44336' }]}>{error}</Text>
              )}

              <View style={styles.buttonRow}>
                <ScalableButton
                  style={[styles.backButton, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
                  onPress={resetState}
                >
                  <Text style={[styles.backButtonText, { color: currentTheme.text }]}>Back</Text>
                </ScalableButton>
                <ScalableButton
                  style={[styles.importButton, { backgroundColor: currentTheme.tint, opacity: hasRequiredFields ? 1 : 0.5 }]}
                  onPress={handleImport}
                  disabled={!hasRequiredFields}
                >
                  <Text style={styles.importButtonText}>Import {rawFile?.rows.length || 0} Items</Text>
                </ScalableButton>
              </View>
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  } as ViewStyle,
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontWeight: '700',
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    padding: 20,
    gap: 24,
  } as ViewStyle,
  section: {
    gap: 12,
  } as ViewStyle,
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  } as TextStyle,
  collectionScroll: {
    flexDirection: 'row',
  } as ViewStyle,
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
  } as ViewStyle,
  collectionChipText: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    gap: 12,
  } as ViewStyle,
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  uploadHint: {
    fontSize: 13,
  } as TextStyle,
  guideCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  } as ViewStyle,
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
  } as TextStyle,
  guideText: {
    fontSize: 13,
  } as TextStyle,
  guideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  } as ViewStyle,
  guideItem: {
    width: '45%',
  } as ViewStyle,
  guideField: {
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  guideAliases: {
    fontSize: 11,
    fontStyle: 'italic',
  } as TextStyle,
  errorContainer: {
    padding: 12,
    borderRadius: 12,
  } as ViewStyle,
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '500',
  } as TextStyle,
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  } as ViewStyle,
  processingText: {
    fontSize: 20,
    fontWeight: '700',
  } as TextStyle,
  processingSubtext: {
    fontSize: 14,
  } as TextStyle,
  mappingContainer: {
    flex: 1,
  } as ViewStyle,
  mappingHeader: {
    padding: 20,
    gap: 4,
  } as ViewStyle,
  mappingTitle: {
    fontSize: 22,
    fontWeight: '700',
  } as TextStyle,
  mappingSubtitle: {
    fontSize: 14,
  } as TextStyle,
  mappingList: {
    flex: 1,
    paddingHorizontal: 20,
  } as ViewStyle,
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  } as ViewStyle,
  mappingFieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  mappingFieldName: {
    fontSize: 15,
    fontWeight: '500',
  } as TextStyle,
  requiredBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f44336',
    backgroundColor: '#ffebee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  } as TextStyle,
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    minWidth: 150,
  } as ViewStyle,
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  } as ViewStyle,
  pickerText: {
    fontSize: 14,
  } as TextStyle,
  mappingFooter: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  } as ViewStyle,
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  statsText: {
    fontSize: 13,
    fontWeight: '500',
  } as TextStyle,
  mappingError: {
    fontSize: 13,
    fontWeight: '500',
  } as TextStyle,
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  } as ViewStyle,
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  } as ViewStyle,
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  importButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  } as ViewStyle,
  importButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  } as TextStyle,
});
