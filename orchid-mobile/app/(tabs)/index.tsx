import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useBinderStore } from '@/stores/useBinderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import EmptyState from '@/components/EmptyState';

export default function HomeScreen() {
  const { binders, isLoading } = useBinderStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!user) return null; // Protected route handles redirect, but safer to render null

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Binders</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Link href="/scan" asChild>
            <Pressable style={[styles.addButton, { backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.textSecondary + '40' }]}>
              <FontAwesome name="qrcode" size={16} color={colors.text} />
            </Pressable>
          </Link>
          <Link href="/modal" asChild>
            <Pressable style={styles.addButton}>
              <FontAwesome name="plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>New</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {isLoading && binders.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Syncing...</Text>
        </View>
      ) : binders.length === 0 ? (
        <EmptyState
          title="No binders yet"
          description="Create your first binder to start curating your favorite brands."
          actionLabel="Create Binder"
          onAction={() => router.push('/modal')}
          icon="folder-open-outline"
        />
      ) : (
        <FlatList
          data={binders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Link href={`/binder/${item.id}`} asChild>
              <Pressable style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <View style={[styles.cardIcon, { backgroundColor: colors.background, borderColor: colors.textSecondary + '20' }]}>
                  <FontAwesome name={item.isShared ? "users" : "book"} size={24} color={colors.text} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    {item.items?.length || 0} items • {item.isShared ? 'Shared' : 'Private'}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Safe area roughly
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#000', // Keep primary action black/prominent? Or use tintColor?
    // Let's keep it consistent with the brand for now, which uses bold black.
    // In dark mode, we might want to invert or use tint.
    // For MVP, black button with white text is safe high contrast usually, but 
    // strictly in dark mode, white button with black text might be better.
    // I'll stick to static for the specific button for now unless user complains about buttons specifically.
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
  },
});
