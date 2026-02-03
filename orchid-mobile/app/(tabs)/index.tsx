import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useBinderStore } from '@/stores/useBinderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import EmptyState from '@/components/EmptyState';
import { ScalableButton } from '@/components/ui/ScalableButton';

export default function HomeScreen() {
  const { binders, isLoading } = useBinderStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { theme } = useUIStore();
  const colorScheme = useColorScheme() ?? 'light';
  // If useUIStore.theme is 'system', we fall back to standard hook/device setting
  // For now to keep it simple, let's stick to the colors derived from the hook which handles system/light/dark
  // But we want to use our NEW Colors object structure which is slightly different

  // Mapping current colorScheme string to our new Theme object
  // Note: Existing code used Colors[colorScheme], which was the OLD structure.
  // The new structure in Theme.ts is: Colors.light or Colors.dark
  // We need to match that.

  const currentTheme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>My Binders</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Link href="/scan" asChild>
            <ScalableButton style={[styles.addButton, { backgroundColor: currentTheme.card, borderWidth: 1, borderColor: currentTheme.border }]}>
              <FontAwesome name="qrcode" size={16} color={currentTheme.text} />
            </ScalableButton>
          </Link>
          <Link href="/modal" asChild>
            <ScalableButton style={[styles.addButton, { backgroundColor: currentTheme.tint }]}>
              <FontAwesome name="plus" size={16} color={currentTheme.textInverse} />
              <Text style={[styles.addButtonText, { color: currentTheme.textInverse }]}>New</Text>
            </ScalableButton>
          </Link>
        </View>
      </View>

      {isLoading && binders.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: currentTheme.textSecondary }}>Syncing...</Text>
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
              <ScalableButton
                scaleTo={0.98}
                style={[styles.card, { backgroundColor: currentTheme.card }]}
              >
                <View style={[styles.cardIcon, { backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}>
                  <FontAwesome name={item.isShared ? "users" : "book"} size={24} color={currentTheme.text} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: currentTheme.text }]}>{item.name}</Text>
                  <Text style={[styles.cardSubtitle, { color: currentTheme.textSecondary }]}>
                    {item.items?.length || 0} items • {item.isShared ? 'Shared' : 'Private'}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} />
              </ScalableButton>
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
