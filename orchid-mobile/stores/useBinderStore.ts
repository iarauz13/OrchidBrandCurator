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
  }
}));
