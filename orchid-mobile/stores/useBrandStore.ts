import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Brand {
  id: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string;
  description?: string;
  category?: string;
  dateAdded: number; // Timestamp
  rating?: number; // 1-5 stars
  tags: string[];
  isFavorite: boolean;
}

interface BrandState {
  brands: Brand[];

  // Actions
  addBrand: (brand: Omit<Brand, 'id' | 'dateAdded'>) => void;
  removeBrand: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      brands: [],

      addBrand: (brandData) => set((state) => {
        const newBrand: Brand = {
          ...brandData,
          id: Math.random().toString(36).substr(2, 9), // Simple ID for now
          dateAdded: Date.now(),
        };
        return { brands: [newBrand, ...state.brands] };
      }),

      removeBrand: (id) => set((state) => ({
        brands: state.brands.filter((b) => b.id !== id),
      })),

      toggleFavorite: (id) => set((state) => ({
        brands: state.brands.map((b) =>
          b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
        ),
      })),

      updateBrand: (id, updates) => set((state) => ({
        brands: state.brands.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      })),
    }),
    {
      name: 'brand-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
