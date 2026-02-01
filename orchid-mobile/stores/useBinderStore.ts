import { create } from 'zustand';
import { StoreItem, Binder } from '@/types/models';

interface BinderState {
  binders: Binder[];
  activeBinderId: string | null;
  items: StoreItem[]; // Items in the active binder context
  isLoading: boolean;

  setBinders: (data: Binder[]) => void;
  setItems: (data: StoreItem[]) => void;
  setActiveBinder: (id: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Optimistic helper (optional for now, but good practice)
  addBinder: (binder: Binder) => void;
}

export const useBinderStore = create<BinderState>((set) => ({
  binders: [],
  activeBinderId: null,
  items: [],
  isLoading: true,

  setBinders: (binders) => set({ binders }),
  setItems: (items) => set({ items }),
  setActiveBinder: (activeBinderId) => set({ activeBinderId }),
  setLoading: (isLoading) => set({ isLoading }),

  addBinder: (binder) => set((state) => ({ binders: [binder, ...state.binders] })),
}));
