import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
// import { BlurView } from 'expo-blur'; // Removing this dependency to avoid needing another install

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  binderId: string;
  binderName: string;
}

export default function QRCodeModal({ visible, onClose, binderId, binderName }: QRCodeModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const url = `orchid://invite/binder/${binderId}`;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        {/* Simple semi-transparent dark background instead of Blur */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.modalView, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{binderName}</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Scan to join</Text>

          <View style={[styles.qrContainer, { borderColor: colors.textSecondary + '20' }]}>
            <QRCode
              value={url}
              size={200}
              color={colors.text}
              backgroundColor={colors.cardBackground}
            />
          </View>

          <Pressable style={[styles.closeButton, { backgroundColor: colors.tint }]} onPress={onClose}>
            <Text style={styles.textStyle}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 16,
    width: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginTop: -8,
    marginBottom: 8,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white', // QR is typically black on white for readability
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeButton: {
    borderRadius: 20,
    padding: 10,
    paddingHorizontal: 20,
    elevation: 2,
    marginTop: 10,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
