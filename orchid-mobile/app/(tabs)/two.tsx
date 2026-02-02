import React, { useState } from 'react';
import { StyleSheet, Pressable, View, Text, Switch, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut, deleteUser } from 'firebase/auth'; // Import signOut and deleteUser from firebase/auth
import { useAuthStore } from '@/stores/useAuthStore';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/config/firebase'; // Ensure deleteUser is imported if we add that logic here directly or via cloud function trigger
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import MobileImportModal from '@/components/MobileImportModal';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore(); // Removed signOut from useAuthStore destructuring
  const router = useRouter();

  const [showImport, setShowImport] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH); // Use signOut from firebase/auth
      router.replace('/');
    } catch (e) {
      Alert.alert("Error", "Failed to log out");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account?",
      "This action is permanent. All your binders and data will be wiped.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (FIREBASE_AUTH.currentUser) {
                await deleteUser(FIREBASE_AUTH.currentUser);
                // Cloud function will clean up data
                router.replace('/');
              }
            } catch (e: any) {
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert("Security Check", "Please log out and log back in to verify your identity before deleting your account.");
              } else {
                Alert.alert("Error", e.message);
              }
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.displayName || 'Orchid Member'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data & Sync</Text>

        <Pressable
          style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
          onPress={() => setShowImport(true)}
        >
          <View style={styles.menuIconInfo}>
            <Ionicons name="cloud-upload" size={20} color={colors.tint} />
            <Text style={[styles.menuText, { color: colors.text }]}>Import Registry</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>

        <Pressable
          style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
          onPress={handleLogout}
        >
          <View style={styles.menuIconInfo}>
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>Log Out</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.menuItem, { backgroundColor: colors.cardBackground, opacity: 0.8 }]}
          onPress={handleDeleteAccount}
        >
          <View style={styles.menuIconInfo}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.menuText, { color: "#FF3B30" }]}>Delete Account</Text>
          </View>
        </Pressable>
      </View>

      <MobileImportModal visible={showImport} onClose={() => setShowImport(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIconInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  }

});
