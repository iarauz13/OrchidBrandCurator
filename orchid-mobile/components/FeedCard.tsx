import { View, Text, StyleSheet, Image, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { ScalableButton } from '@/components/ui/ScalableButton';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { AppNotification } from '@/data/mockData';

const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

interface FeedCardProps {
  item: AppNotification;
}

export function FeedCard({ item }: FeedCardProps) {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  return (
    <View style={styles.container}>
      {/* Header: Brand Info */}
      <View style={styles.header}>
        <Image
          source={{ uri: item.brandImageUrl }}
          style={[styles.brandLogo, { borderColor: currentTheme.border }]}
        />
        <View>
          <Text style={[styles.brandName, { color: currentTheme.text }]}>{item.storeName}</Text>
          <Text style={[styles.timestamp, { color: currentTheme.textSecondary }]}>
            {timeSince(item.timestamp)}
          </Text>
        </View>
      </View>

      {/* Main Content Card */}
      <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        {item.activityImageUrl && (
          <Image source={{ uri: item.activityImageUrl }} style={styles.heroImage} />
        )}

        <View style={styles.content}>
          <Text style={[styles.title, { color: currentTheme.text }]}>{item.title}</Text>
          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>{item.message}</Text>

          {item.ctaText && (
            <ScalableButton
              style={[styles.ctaButton, { backgroundColor: currentTheme.tint }]}
              onPress={() => { /* Open Link */ }}
            >
              <Text style={[styles.ctaText, { color: currentTheme.textInverse }]}>{item.ctaText}</Text>
            </ScalableButton>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  } as ViewStyle,
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  } as ImageStyle,
  brandName: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  timestamp: {
    fontSize: 12,
  } as TextStyle,
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  heroImage: {
    width: '100%',
    height: 200,
  } as ImageStyle,
  content: {
    padding: 20,
    gap: 12,
  } as ViewStyle,
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
  } as TextStyle,
  message: {
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  ctaButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  } as ViewStyle,
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle
});
