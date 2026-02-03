import { create } from 'zustand';
import { Collection, StoreItem } from '@/types/models';

interface CollectionState {
  collections: Collection[];
  activeCollectionId: string | null;

  // Actions
  setActiveCollection: (id: string | null) => void;
  addCollection: (collection: Collection) => void;
  removeCollection: (id: string) => void;
  clearCollection: (id: string) => void;
  importItems: (collectionId: string, items: StoreItem[], mode: 'replace' | 'append') => void;
  loadSampleCollections: () => void;
  renameCollection: (id: string, newName: string) => void;
}

// Generate simple ID
const generateId = () => Math.random().toString(36).substring(2, 11);

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  activeCollectionId: null,

  setActiveCollection: (id) => {
    set({ activeCollectionId: id });
  },

  addCollection: (collection) => {
    set((state) => ({
      collections: [...state.collections, collection],
      activeCollectionId: state.activeCollectionId || collection.id,
    }));
  },

  removeCollection: (id) => {
    set((state) => {
      const newCollections = state.collections.filter((c) => c.id !== id);
      const newActiveId = state.activeCollectionId === id
        ? (newCollections.length > 0 ? newCollections[0].id : null)
        : state.activeCollectionId;
      return {
        collections: newCollections,
        activeCollectionId: newActiveId,
      };
    });
    console.log(`[CollectionStore] Removed collection ${id}`);
  },

  renameCollection: (id: string, newName: string) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, name: newName } : c
      ),
    }));
  },

  clearCollection: (id) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, stores: [], updatedAt: Date.now() } : c
      ),
    }));
    console.log(`[CollectionStore] Cleared collection ${id}`);
  },

  importItems: (collectionId, items, mode) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
            ...c,
            stores: mode === 'replace' ? items : [...c.stores, ...items],
            updatedAt: Date.now(),
          }
          : c
      ),
    }));
    console.log(`[CollectionStore] Imported ${items.length} items (mode: ${mode}) into collection ${collectionId}`);
  },

  loadSampleCollections: () => {
    const now = Date.now();
    const sampleCollections: Collection[] = [
      {
        id: generateId(),
        name: 'My Fashion Brands',
        ownerId: 'guest',
        coverImage: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
        createdAt: now,
        updatedAt: now,
        stores: [
          { id: generateId(), name: 'Acne Studios', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/acnestudios.com', website: 'https://acnestudios.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Aesop', category: 'Beauty', logoUrl: 'https://logo.clearbit.com/aesop.com', website: 'https://aesop.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Anthropologie', category: 'Lifestyle', logoUrl: 'https://logo.clearbit.com/anthropologie.com', website: 'https://anthropologie.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Burberry', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/burberry.com', website: 'https://burberry.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Balenciaga', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/balenciaga.com', website: 'https://balenciaga.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'COS', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/cosstores.com', website: 'https://cosstores.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Céline', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/celine.com', website: 'https://celine.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Dior', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/dior.com', website: 'https://dior.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Everlane', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/everlane.com', website: 'https://everlane.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Free People', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/freepeople.com', website: 'https://freepeople.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Gucci', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/gucci.com', website: 'https://gucci.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'H&M', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/hm.com', website: 'https://hm.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Isabel Marant', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/isabelmarant.com', website: 'https://isabelmarant.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'J.Crew', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/jcrew.com', website: 'https://jcrew.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Kenzo', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/kenzo.com', website: 'https://kenzo.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Loewe', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/loewe.com', website: 'https://loewe.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Mango', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/mango.com', website: 'https://mango.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Nike', category: 'Sportswear', logoUrl: 'https://logo.clearbit.com/nike.com', website: 'https://nike.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Off-White', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/off---white.com', website: 'https://off---white.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Prada', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/prada.com', website: 'https://prada.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Reformation', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/thereformation.com', website: 'https://thereformation.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Sandro', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/sandro-paris.com', website: 'https://sandro-paris.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Totême', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/toteme-studio.com', website: 'https://toteme-studio.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Uniqlo', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/uniqlo.com', website: 'https://uniqlo.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Versace', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/versace.com', website: 'https://versace.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Warby Parker', category: 'Accessories', logoUrl: 'https://logo.clearbit.com/warbyparker.com', website: 'https://warbyparker.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Yves Saint Laurent', category: 'Luxury', logoUrl: 'https://logo.clearbit.com/ysl.com', website: 'https://ysl.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Zara', category: 'Fashion', logoUrl: 'https://logo.clearbit.com/zara.com', website: 'https://zara.com', createdAt: now, addedBy: 'system' },
        ],
      },
      {
        id: generateId(),
        name: 'Tech Companies',
        ownerId: 'guest',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        createdAt: now,
        updatedAt: now,
        stores: [
          { id: generateId(), name: 'Apple', category: 'Tech', logoUrl: 'https://logo.clearbit.com/apple.com', website: 'https://apple.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Figma', category: 'Design', logoUrl: 'https://logo.clearbit.com/figma.com', website: 'https://figma.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Google', category: 'Tech', logoUrl: 'https://logo.clearbit.com/google.com', website: 'https://google.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Microsoft', category: 'Tech', logoUrl: 'https://logo.clearbit.com/microsoft.com', website: 'https://microsoft.com', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Notion', category: 'Productivity', logoUrl: 'https://logo.clearbit.com/notion.so', website: 'https://notion.so', createdAt: now, addedBy: 'system' },
          { id: generateId(), name: 'Stripe', category: 'Fintech', logoUrl: 'https://logo.clearbit.com/stripe.com', website: 'https://stripe.com', createdAt: now, addedBy: 'system' },
        ],
      },
    ];

    set({
      collections: sampleCollections,
      activeCollectionId: sampleCollections[0].id,
    });
    console.log('[CollectionStore] Loaded sample collections');
  },
}));
