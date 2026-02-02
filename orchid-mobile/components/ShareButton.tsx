import React from 'react';
import { Share, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Binder, StoreItem } from '@/types/models';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ShareButtonProps {
  binder: Binder;
  items: StoreItem[];
}

export default function ShareButton({ binder, items }: ShareButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleShare = async () => {
    try {
      // 1. Format the list of stores
      const storeList = items
        .map((item, index) => `${index + 1}. ${item.name} - ${item.website || 'No link'}`)
        .join('\n');

      // 2. Generate Deep Link (Scheme: orchid://)
      // Note: In development/simulator, this opens the app. 
      // In prod, this would need Universal Links (HTTPS) to handle "App not installed" cases.
      const deepLink = `orchid://invite/binder/${binder.id}`;

      // 3. Construct the Message
      const message = `Check out my "${binder.name}" Binder on Orchid 🌸\n\n${storeList}\n\nJoin me here:\n${deepLink}`;

      // 4. Trigger Native Share Sheet
      const result = await Share.share({
        message,
        url: deepLink, // iOS often uses this for the "copy link" feature
        title: `Join my ${binder.name} Binder`, // Android only
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log('Shared via', result.activityType);
        } else {
          // Shared
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log('Share dismissed');
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} style={styles.button}>
      <FontAwesome name="share-square-o" size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
