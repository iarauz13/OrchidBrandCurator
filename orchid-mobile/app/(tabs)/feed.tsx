import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { mockNotifications } from '@/data/mockData';
import { FeedCard } from '@/components/FeedCard';

export default function FeedScreen() {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <FlatList
        data={mockNotifications.filter(n => n.type === 'brand')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>Brands Activity</Text>
            <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
              Latest drops from your curated brands
            </Text>
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
  listContent: {
    padding: 20,
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});
