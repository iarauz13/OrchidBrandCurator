import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/config/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { ScalableButton } from '@/components/ui/ScalableButton';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';

export default function ModalScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  const handleCreate = async () => {
    if (!name.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(FIREBASE_DB, 'binders'), {
        name: name.trim(),
        description: description.trim(),
        ownerId: user.uid,
        participants: [user.uid], // Critical for the subscription query
        isShared: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        items: [] // Initial empty state
      });
      router.back();
    } catch (error) {
      console.error("Failed to create binder:", error);
      alert("Error creating binder");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Text style={[styles.title, { color: currentTheme.text }]}>New Binder</Text>

      <View style={styles.formGroup}>
        <TextInput
          style={[styles.input, {
            backgroundColor: currentTheme.card,
            borderColor: currentTheme.border,
            color: currentTheme.text
          }]}
          placeholder="Binder Name (e.g., Summer 2024)"
          placeholderTextColor={currentTheme.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <TextInput
          style={[styles.input, styles.textArea, {
            backgroundColor: currentTheme.card,
            borderColor: currentTheme.border,
            color: currentTheme.text
          }]}
          placeholder="Description (Optional)"
          placeholderTextColor={currentTheme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={currentTheme.tint} />
        ) : (
          <View style={{ gap: 12 }}>
            <ScalableButton
              style={[
                styles.button,
                { backgroundColor: isFormValid ? currentTheme.tint : currentTheme.border }
              ]}
              onPress={handleCreate}
              disabled={!isFormValid}
            >
              <Text style={[styles.buttonText, { color: currentTheme.textInverse }]}>Create Binder</Text>
            </ScalableButton>

            <ScalableButton
              style={[styles.button, { backgroundColor: 'transparent' }]}
              onPress={() => router.back()}
              scaleTo={0.98}
            >
              <Text style={[styles.buttonText, { color: currentTheme.textSecondary }]}>Cancel</Text>
            </ScalableButton>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 20,
  },
  formGroup: {
    gap: 16,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 'auto',
    gap: 12,
  },
  button: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
