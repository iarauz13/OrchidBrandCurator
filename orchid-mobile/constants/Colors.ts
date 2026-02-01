const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    textSecondary: '#666', // High contrast on white (WCAG AA)
    background: '#fff',
    cardBackground: '#f9f9f9',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    textSecondary: '#ccc', // High contrast on dark (WCAG AA)
    background: '#000',
    cardBackground: '#1c1c1e', // Standard iOS Dark Mode Grouped Background
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
