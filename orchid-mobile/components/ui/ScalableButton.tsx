import React from 'react';
import { Pressable, StyleSheet, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useUIStore } from '@/stores/useUIStore';

// Define the animated pressable to create a "Component" 
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalableButtonProps extends PressableProps {
  onPress?: () => void;
  scaleTo?: number; // How much to scale down? Default 0.96
  hapticType?: Haptics.ImpactFeedbackStyle; // Light, Medium, Heavy
  containerStyle?: ViewStyle;
  children: React.ReactNode;
}

export const ScalableButton: React.FC<ScalableButtonProps> = ({
  onPress,
  scaleTo = 0.96,
  hapticType = Haptics.ImpactFeedbackStyle.Light,
  containerStyle,
  style,
  children,
  ...props
}) => {
  const scale = useSharedValue(1);
  const { isReducedMotionEnabled } = useUIStore();

  const handlePressIn = () => {
    // 1. Haptic Feedback (Run on JS thread because Haptics is a native module)
    runOnJS(Haptics.impactAsync)(hapticType);

    // 2. Animate Scale (Spring for "organic" feel)
    if (!isReducedMotionEnabled) {
      scale.value = withSpring(scaleTo, {
        mass: 0.5,
        damping: 10,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    // Return to original size
    if (!isReducedMotionEnabled) {
      scale.value = withSpring(1, {
        mass: 0.5,
        damping: 12, // Slightly higher damping for no bounce-back overshoot
        stiffness: 300,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, animatedStyle, style as any]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({});
