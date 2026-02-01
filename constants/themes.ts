
import { ThemeConfig } from '../types';

/**
 * Curated Theme Library.
 * 
 * Architectural Choice: 
 * We use 5 specific high-end gradients.
 * Instead of generic grey text (#6b7280) or reducing white opacity, 
 * we use 'textSecondary' colors that are specific tints derived from the 
 * background to create hierarchy while maintaining vibrancy and richness.
 */
export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'champagne-pearl',
    name: 'Champagne & Pearl',
    background: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
    accent: '#854d0e',
    textOnAccent: '#FFFFFF',
    textPrimary: '#4a3728',
    textSecondary: '#8a7161',
    textOnSurfacePrimary: '#4a3728',
    textOnSurfaceSecondary: '#8a7161',
    isDarkBackground: false
  },
  {
    id: 'midnight-silk',
    name: 'Midnight Silk',
    background: 'linear-gradient(to top, #09203f 0%, #537895 100%)',
    accent: '#38bdf8',
    textOnAccent: '#0f172a',
    textPrimary: '#e0f2fe',
    textSecondary: '#7dd3fc',
    textOnSurfacePrimary: '#0f172a', // Deep Slate for white cards
    textOnSurfaceSecondary: '#475569',
    isDarkBackground: true
  },
  {
    id: 'velvet-orchid',
    name: 'Velvet Orchid',
    background: 'linear-gradient(to right, #24243e, #302b63, #0f0c29)',
    accent: '#d8b4fe',
    textOnAccent: '#0f0c29',
    textPrimary: '#f3e8ff',
    textSecondary: '#c084fc',
    textOnSurfacePrimary: '#2e1065', // Deep Purple for white cards
    textOnSurfaceSecondary: '#581c87',
    isDarkBackground: true
  },
  {
    id: 'botanical-sanctuary',
    name: 'Botanical Sanctuary',
    background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    accent: '#a7f3d0',
    textOnAccent: '#064e3b',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    textOnSurfacePrimary: '#064e3b', // Deep Green for white cards
    textOnSurfaceSecondary: '#059669',
    isDarkBackground: true
  },
  {
    id: 'blush-petal',
    name: 'Blush Petal',
    background: 'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
    accent: '#be123c',
    textOnAccent: '#fff1f2',
    textPrimary: '#881337',
    textSecondary: '#fb7185',
    textOnSurfacePrimary: '#881337',
    textOnSurfaceSecondary: '#9f1239',
    isDarkBackground: false
  }
];

export const DEFAULT_THEME = THEME_PRESETS[1]; // Midnight Silk default
