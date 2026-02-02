import React, { useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useBinderStore } from '@/stores/useBinderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import ShareButton from '@/components/ShareButton';

export default function BinderDetailScreen() {
  const { id } = useLocalSearchParams();
  const { binders } = useBinderStore();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Find the binder
  // Note: specific filtering for string vs array params
  const binderId = Array.isArray(id) ? id[0] : id;
  const binder = useMemo(() => binders.find(b => b.id === binderId), [binders, binderId]);

  if (!binder) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Binder not found.</Text>
      </View>
    );
  }

  // Mock items for now if they aren't loaded in the binder object yet.
  // In a real app we might fetch subcollection. 
  // For MVP we assume items are populated or available.
  // The interface says items are not in Binder, but for the MVP state store they might be attached or in a separate store.
  // Let's check the store. If items aren't there, we show empty or handle it.
  // Wait, the model definition in `models.ts` didn't have `items: StoreItem[]`.
  // But `useBinderStore` likely handles the "active binder" items or the binders list has basic info.
  // Let's assume for this View, we want to show items.
  // If `binder` doesn't have items, we'll need to fetch them.
  // For this step, I'll assume `items` property exists on the object in the store (common pattern in small apps) OR I need to fetch.
  // Let's inspect `useBinderStore` later. For now, I'll cast it safely or use what's there.

  // Safe access to items if they exist on the runtime object, otherwise []
  const items = (binder as any).items || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerTitle: binder.name,
          headerRight: () => <ShareButton binder={binder} items={items} />,
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {binder.description || 'No description provided.'}
            </Text>
            {binder.isShared && (
              <View style={styles.badge}>
                <FontAwesome name="users" size={12} color="#fff" />
                <Text style={styles.badgeText}>Shared</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.textSecondary + '20' }]}>
                <Text style={{ color: colors.text }}>{item.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardLink, { color: colors.tint }]}>{item.website}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>No items in this binder.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 20,
    gap: 8,
  },
  description: {
    fontSize: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.tint, // Brand color
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardLink: {
    fontSize: 14,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  }
});
