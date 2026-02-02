import React from 'react';
import { Share, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StoreItem } from '@/types/models';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface StoreShareButtonProps {
  item: StoreItem;
}

export default function StoreShareButton({ item }: StoreShareButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleShare = async () => {
    try {
      const message = `Check out "${item.name}" on Orchid 🌸\n\n${item.website || 'No website link'}`;

      const result = await Share.share({
        message,
        url: item.website || undefined, // iOS uses this for link preview
        title: `Share ${item.name}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} style={styles.button}>
      <FontAwesome name="share-alt" size={16} color={colors.tint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
