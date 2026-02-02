import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ visible, onClose }: TermsOfServiceModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>Terms of Service & Privacy Policy</Text>
          <ScrollView style={styles.scrollView}>
            <Text style={[styles.text, { color: colors.text }]}>
              {`Last Updated: Feb 2025

1. Acceptance of Terms
By accessing or using Orchid (the "App"), you agree to be bound by these Terms of Service.

2. User Content (UGC) Policy
- You are responsible for the content (binders, items, images) you create or share.
- You must NOT post content that is illegal, abusive, harassing, hateful, or explicit.
- We reserve the right to remove any content and ban users who violate these rules.
- Users can report objectionable content, which will be reviewed within 24 hours.
- Repeat offenders will be permanently blocked.

3. Privacy Policy
- We collect your email and usage data to provide the service.
- You can delete your account and data at any time from the Profile settings.
- We do not sell your personal data to third parties.

4. Account Deletion
You may delete your account at any time. This will permanently remove all your data, including binders and shared items.

5. Disclaimer
The App is provided "as is" without warranties of any kind.

Contact us at support@orchid.app for questions.`}
            </Text>
          </ScrollView>
          <Pressable
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>I Understand</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollView: {
    marginBottom: 20,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
