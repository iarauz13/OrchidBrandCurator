import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ScalableButton } from '@/components/ui/ScalableButton';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';

interface ActionRowProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
  onPress: () => void;
  isDestructive?: boolean;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  title,
  description,
  onPress,
  isDestructive = false,
}) => {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];

  const iconColor = isDestructive ? '#ff3b30' : currentTheme.tint;

  return (
    <ScalableButton style={[styles.container, { backgroundColor: currentTheme.card }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#ffebee' : currentTheme.backgroundTertiary }]}>
        <FontAwesome name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: isDestructive ? '#ff3b30' : currentTheme.text }]}>{title}</Text>
        <Text style={[styles.description, { color: currentTheme.textSecondary }]}>{description}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} />
    </ScalableButton>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  } as ViewStyle,
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  textContainer: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  title: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  description: {
    fontSize: 13,
    fontWeight: '400',
  } as TextStyle,
});
