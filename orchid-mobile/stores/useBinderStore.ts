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
  joinBinder: (binderId: string, userId: string) => Promise<void>;

  // Data Management Actions
  clearBinder: (binderId: string) => void;
  removeBinder: (binderId: string) => void;
  renameBinder: (binderId: string, newName: string) => void;
  loadSampleData: () => void;
  importItems: (binderId: string, items: StoreItem[], mode: 'replace' | 'append') => void;
  addItemsToBinder: (binderId: string, items: StoreItem[]) => void;
  removeItemFromBinder: (binderId: string, itemId: string) => void;
}

export const useBinderStore = create<BinderState>((set, get) => ({
  binders: [],
  activeBinderId: null,
  items: [],
  isLoading: true,

  setBinders: (binders) => set({ binders }),
  setItems: (items) => set({ items }),
  setActiveBinder: (activeBinderId) => set({ activeBinderId }),
  setLoading: (isLoading) => set({ isLoading }),

  addBinder: (binder) => set((state) => ({ binders: [binder, ...state.binders] })),

  joinBinder: async (binderId: string, userId: string) => {
    try {
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      const { FIREBASE_DB } = await import('@/config/firebase');

      const binderRef = doc(FIREBASE_DB, 'binders', binderId);
      await updateDoc(binderRef, {
        participants: arrayUnion(userId),
        isShared: true // Implicitly becomes shared
      });
      console.log(`[BinderStore] User ${userId} joined binder ${binderId}`);
    } catch (error) {
      console.error("[BinderStore] Failed to join binder:", error);
      throw error;
    }
  },

  clearBinder: (binderId: string) => {
    set((state) => ({
      binders: state.binders.map((b) =>
        b.id === binderId ? { ...b, items: [] } : b
      ),
      // If active binder is cleared, also clear items
      items: state.activeBinderId === binderId ? [] : state.items,
    }));
    console.log(`[BinderStore] Cleared binder ${binderId}`);
  },

  removeBinder: (binderId: string) => {
    set((state) => {
      const newBinders = state.binders.filter((b) => b.id !== binderId);
      const newActiveId = state.activeBinderId === binderId
        ? (newBinders.length > 0 ? newBinders[0].id : null)
        : state.activeBinderId;
      return {
        binders: newBinders,
        activeBinderId: newActiveId,
        items: state.activeBinderId === binderId ? [] : state.items,
      };
    });
    console.log(`[BinderStore] Removed binder ${binderId}`);
  },

  renameBinder: (binderId: string, newName: string) => {
    set((state) => ({
      binders: state.binders.map((b) =>
        b.id === binderId ? { ...b, name: newName } : b
      ),
    }));
    console.log(`[BinderStore] Renamed binder ${binderId} to ${newName}`);
  },

  loadSampleData: () => {
    const now = Date.now();
    const sampleItems: StoreItem[] = [
      { id: 'sample-1', name: 'Acne Studios', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/acnestudios.com', website: 'https://acnestudios.com', createdAt: now, addedBy: 'system' },
      { id: 'sample-2', name: 'Aesop', category: 'Beauty', logoUrl: 'https://logo.clearbit.com/aesop.com', website: 'https://aesop.com', createdAt: now, addedBy: 'system' },
      { id: 'sample-3', name: 'Maison Kitsuné', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/maisonkitsune.com', website: 'https://maisonkitsune.com', createdAt: now, addedBy: 'system' },
      { id: 'sample-4', name: 'Le Labo', category: 'Fragrance', logoUrl: 'https://logo.clearbit.com/lelabofragrances.com', website: 'https://lelabofragrances.com', createdAt: now, addedBy: 'system' },
      { id: 'sample-5', name: 'Diptyque', category: 'Fragrance', logoUrl: 'https://logo.clearbit.com/diptyqueparis.com', website: 'https://diptyqueparis.com', createdAt: now, addedBy: 'system' },
    ];

    const state = get();
    if (state.activeBinderId) {
      set((s) => ({
        binders: s.binders.map((b) =>
          b.id === state.activeBinderId
            ? { ...b, items: [...(b.items || []), ...sampleItems] }
            : b
        ),
        items: [...s.items, ...sampleItems],
      }));
      console.log(`[BinderStore] Loaded sample data into active binder`);
    } else {
      console.warn('[BinderStore] No active binder to load sample data into');
    }
  },

  importItems: (binderId: string, items: StoreItem[], mode: 'replace' | 'append') => {
    set((state) => ({
      binders: state.binders.map((b) =>
        b.id === binderId
          ? { ...b, items: mode === 'replace' ? items : [...(b.items || []), ...items] }
          : b
      ),
      items: state.activeBinderId === binderId
        ? (mode === 'replace' ? items : [...state.items, ...items])
        : state.items,
    }));
    console.log(`[BinderStore] Imported ${items.length} items (mode: ${mode})`);
  },

  addItemsToBinder: (binderId: string, items: StoreItem[]) => {
    set((state) => ({
      binders: state.binders.map((b) =>
        b.id === binderId
          ? { ...b, items: [...(b.items || []), ...items] }
          : b
      ),
      items: state.activeBinderId === binderId
        ? [...state.items, ...items]
        : state.items,
    }));
    console.log(`[BinderStore] Added ${items.length} items to binder ${binderId}`);
  },

  removeItemFromBinder: (binderId: string, itemId: string) => {
    set((state) => ({
      binders: state.binders.map((b) =>
        b.id === binderId
          ? { ...b, items: (b.items || []).filter((item) => item.id !== itemId) }
          : b
      ),
      items: state.activeBinderId === binderId
        ? state.items.filter((item) => item.id !== itemId)
        : state.items,
    }));
    console.log(`[BinderStore] Removed item ${itemId} from binder ${binderId}`);
  },
}));

