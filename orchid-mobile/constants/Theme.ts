import { Platform } from 'react-native';

const palette = {
  // Primary Brand Colors (Orchid)
  primary: '#8A2BE2', // Blue Violet
  primaryLight: '#A35CE8',
  primaryDark: '#6A1B9A',

  // Functional Colors
  success: '#34C759', // iOS Green
  warning: '#FF9500', // iOS Orange
  error: '#FF3B30',   // iOS Red
  info: '#5856D6',    // iOS Indigo

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F2F2F7', // iOS System Gray 6
  gray200: '#E5E5EA', // iOS System Gray 5
  gray300: '#D1D1D6', // iOS System Gray 4
  gray400: '#C7C7CC', // iOS System Gray 3
  gray500: '#AEAEB2', // iOS System Gray 2
  gray600: '#8E8E93', // iOS System Gray
  gray700: '#636366',
  gray800: '#3A3A3C',
  gray900: '#1C1C1E',
};

export const Colors = {
  light: {
    text: palette.black,
    textSecondary: palette.gray600,
    textTertiary: palette.gray500,
    textInverse: palette.white,

    background: palette.white,
    backgroundSecondary: palette.gray50,
    backgroundTertiary: palette.gray100,

    border: palette.gray200,

    tint: palette.primary,
    tabIconDefault: palette.gray400,
    tabIconSelected: palette.primary,

    card: palette.white,
    status: {
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
    }
  },
  dark: {
    text: palette.white,
    textSecondary: palette.gray500,
    textTertiary: palette.gray600,
    textInverse: palette.black,

    background: palette.black,
    backgroundSecondary: palette.gray900,
    backgroundTertiary: palette.gray800,

    border: palette.gray800,

    tint: palette.primaryLight,
    tabIconDefault: palette.gray700,
    tabIconSelected: palette.primaryLight,

    card: palette.gray900,
    status: {
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
    }
  },
  champagne: {
    // Web: Champagne & Pearl (Warm/Pearl gradient)
    text: '#4a3728', // Dark warm brown
    textSecondary: '#8a7161',
    textTertiary: '#bcaaa4',
    textInverse: '#ffffff',

    background: '#F9F4F0', // Pearl/Off-white solid approximation
    backgroundSecondary: '#EFEBE9',
    backgroundTertiary: '#e2d1c3',

    border: '#d7ccc8',

    tint: '#854d0e', // Gold/Bronze accent
    tabIconDefault: '#8a7161',
    tabIconSelected: '#854d0e',

    card: '#ffffff',
    status: {
      success: '#2E7D32',
      warning: '#EF6C00',
      error: '#C62828',
    }
  },
  midnight: {
    // Web: Midnight Silk (Deep Blue/Slate gradient)
    text: '#e0f2fe', // Very light blue
    textSecondary: '#7dd3fc',
    textTertiary: '#38bdf8',
    textInverse: '#0f172a',

    background: '#0f172a', // Deep Slate Blue solid
    backgroundSecondary: '#1e293b',
    backgroundTertiary: '#334155',

    border: '#1e293b',

    tint: '#38bdf8', // Sky Blue accent
    tabIconDefault: '#475569',
    tabIconSelected: '#38bdf8',

    card: '#1e293b',
    status: {
      success: '#00E676',
      warning: '#FFAB00',
      error: '#FF1744',
    }
  },
  botanical: {
    // Web: Botanical Sanctuary (Forest/Teal gradient)
    text: '#ecfdf5', // Mint cream
    textSecondary: '#6ee7b7',
    textTertiary: '#34d399',
    textInverse: '#064e3b',

    background: '#064e3b', // Deep Forest Green
    backgroundSecondary: '#065f46',
    backgroundTertiary: '#047857',

    border: '#065f46',

    tint: '#a7f3d0', // Mint Green accent
    tabIconDefault: '#059669',
    tabIconSelected: '#a7f3d0',

    card: '#065f46',
    status: {
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    }
  }
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  s: 4,
  m: 8,
  l: 12,
  xl: 16,
  circle: 999,
};

export const Typography = {
  fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }), // Placeholder until custom fonts are loaded
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  sizes: {
    xs: 12,
    s: 14,
    m: 16,
    l: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  }
};

export default { Colors, Spacing, BorderRadius, Typography };
