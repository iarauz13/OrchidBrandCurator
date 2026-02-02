import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useBinderStore } from '@/stores/useBinderStore';
import { useAuthStore } from '@/stores/useAuthStore';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const { joinBinder } = useBinderStore();
  const { user } = useAuthStore();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    // Check if it's an orchid link
    if (data.startsWith('orchid://invite/binder/')) {
      setScanned(true);
      const binderId = data.split('orchid://invite/binder/')[1];

      if (!user) {
        Alert.alert("Please login first");
        router.replace('/(auth)/login');
        return;
      }

      try {
        await joinBinder(binderId, user.uid);
        Alert.alert("Success", "You joined the binder!", [
          { text: "Open", onPress: () => router.replace(`/binder/${binderId}`) }
        ]);
      } catch (e) {
        Alert.alert("Error", "Failed to join");
        setScanned(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instructions}>Scan a friend's Binder QR code</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  instructions: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  closeText: {
    fontWeight: 'bold',
    color: 'black',
  }

});
