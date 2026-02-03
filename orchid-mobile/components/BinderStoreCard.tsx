import { View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import { StoreItem } from '@/types/models';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface BinderStoreCardProps {
  item: StoreItem;
  onPress?: () => void;
}

export function BinderStoreCard({ item, onPress }: BinderStoreCardProps) {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  const handleOpenLink = () => {
    if (item.website) {
      Linking.openURL(item.website);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.7} style={[styles.container, { backgroundColor: currentTheme.card }]} onPress={onPress}>
      <View style={[styles.iconPlaceholder, { backgroundColor: currentTheme.backgroundSecondary, borderColor: currentTheme.border }]}>
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.logo} />
        ) : (
          <Text style={[styles.initial, { color: currentTheme.textSecondary }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: currentTheme.text }]}>{item.name}</Text>
          {item.category && (
            <View style={[styles.badge, { backgroundColor: currentTheme.tint + '20' }]}>
              <Text style={[styles.badgeText, { color: currentTheme.tint }]}>{item.category}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text numberOfLines={2} style={[styles.description, { color: currentTheme.textSecondary }]}>
            {item.description}
          </Text>
        )}

        {item.website && (
          <TouchableOpacity onPress={handleOpenLink} style={styles.linkRow}>
            <FontAwesome name="link" size={12} color={currentTheme.textTertiary} />
            <Text style={[styles.linkText, { color: currentTheme.textTertiary }]}>
              {item.website.replace(/^https?:\/\/(www\.)?/, '')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 16,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  linkText: {
    fontSize: 12,
  }
});
