import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// NOTE: We will use AsyncStorage for compatibility with Expo Go for now. 
// Transition to MMKV requires a custom dev client. 
// If MMKV is set up, replace 'storage' implementation below.

/* Optional MMKV setup:
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();
const mmkvStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
};
*/

interface UIState {
  theme: 'light' | 'dark' | 'system' | 'champagne' | 'midnight' | 'botanical';
  isMascotEnabled: boolean;
  isReducedMotionEnabled: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system' | 'champagne' | 'midnight' | 'botanical') => void;
  toggleMascot: () => void;
  toggleReducedMotion: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      isMascotEnabled: true,
      isReducedMotionEnabled: false,

      setTheme: (theme) => set({ theme }),
      toggleMascot: () => set((state) => ({ isMascotEnabled: !state.isMascotEnabled })),
      toggleReducedMotion: () => set((state) => ({ isReducedMotionEnabled: !state.isReducedMotionEnabled })),
    }),
    {
      name: 'ui-settings',
      storage: createJSONStorage(() => AsyncStorage), // Switch to mmkvStorage if ejected/prebuilt
    }
  )
);
