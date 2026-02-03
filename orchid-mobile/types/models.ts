export interface StoreItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  logoUrl?: string; // Phase 0/3 artifact
  website?: string;
  userNote?: string;
  createdAt: number;
  addedBy: string; // userId
}

export interface Binder {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  participants: string[]; // [ownerId, ...friendIds] for "array-contains" query
  coverImage?: string;
  themeColor?: string;
  isShared: boolean;
  createdAt: number;
  updatedAt: number;
  items?: StoreItem[]; // Hydrated items for UI convenience
  // In a sub-collection architecture, items wouldn't be here, 
  // but for MVP "Small Data" (<500 items), embedded array is fine for read performance.
  // We will keep them separate in Firestore usually, but for the Store State we might join them?
  // The User requirement says: "items: StoreItem[] // Items in the active binder" in the store.
  // We will keep the Type definition distinct.
}

/**
 * Collection: Main data container for brand imports (from CSV/JSON files).
 * Collections are the primary "dictionaries" users build with their brands.
 * Binders are separate sub-groupings created from Collection items.
 */
export interface Collection {
  id: string;
  name: string;
  ownerId: string;
  stores: StoreItem[]; // Brand items imported into this collection
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
}

