import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/config/firebase';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ModalScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Binder</Text>

      <TextInput
        style={styles.input}
        placeholder="Binder Name (e.g., Summer 2024)"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Create Binder" onPress={handleCreate} disabled={!name.trim()} />
        )}
        <Button title="Cancel" color="#666" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
});
