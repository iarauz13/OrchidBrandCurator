import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/config/firebase';

export default function AppleAuthButton() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  if (!isAvailable) return null;

  const handleAppleLogin = async () => {
    try {
      const start = Date.now();
      const randomNonce = Math.random().toString(36).substring(2, 10);
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        randomNonce
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: randomNonce // The RAW nonce is sent to Apple
      });

      const { identityToken, authorizationCode } = appleCredential;

      if (!identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: randomNonce, // Firebase needs the RAW nonce to verify against the hash in the token
      });

      await signInWithCredential(FIREBASE_AUTH, credential);
      // Auth listener in _layout.tsx will handle redirect

    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled, do nothing
        return;
      }
      console.error('Apple Login Error:', e);
      Alert.alert('Login Failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        style={styles.button}
        onPress={handleAppleLogin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    marginTop: 12,
  },
  button: {
    width: '100%',
    height: '100%',
  },
});
