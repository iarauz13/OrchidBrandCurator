import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/config/firebase';
import { useRouter } from 'expo-router';
import TermsOfServiceModal from '@/components/TermsOfServiceModal';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);

      // Create user document with compliance metadata
      if (userCredential.user) {
        await setDoc(doc(FIREBASE_DB, 'users', userCredential.user.uid), {
          email: email,
          createdAt: new Date(),
          acceptedTermsAt: new Date(),
          role: 'user'
        });
      }

      // Protected route hook will handle navigation
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.checkboxContainer}>
          <Pressable onPress={() => setAgreed(!agreed)} style={styles.checkbox}>
            {agreed ? (
              <View style={styles.checkedBox} />
            ) : (
              <View style={styles.uncheckedBox} />
            )}
          </Pressable>
          <Text style={styles.checkboxLabel}>
            I agree to the <Text style={styles.link} onPress={() => setShowTerms(true)}>Terms & Privacy Policy</Text>
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button title="Create Account" onPress={handleSignup} disabled={!agreed} />
        )}

        <Button title="Back to Login" onPress={() => router.back()} color="#666" />
      </View>

      <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 48,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    width: 14,
    height: 14,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  uncheckedBox: {
    width: 14,
    height: 14,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
