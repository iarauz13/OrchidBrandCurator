import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Store, User, AppNotification, Collection, ThemeConfig, Folio } from './types';
import { COLLECTION_TEMPLATES } from './collectionTemplates';
import { THEME_PRESETS, DEFAULT_THEME } from './constants/themes';
import StoreList from './components/StoreList';
import EditModal from './components/EditModal';
import DynamicFilterSidebar from './components/DynamicFilterSidebar';
import AddStoreModal from './components/AddStoreModal';
import Header from './components/Header';
import ProfilePage from './components/ProfilePage';
import ImportModal from './components/ImportModal';
import NotificationsPage from './components/NotificationsPage';
import MapView from './components/MapView';
import LoginModal from './components/LoginModal';
import LandingPage from './components/LandingPage';
import ContactDrawer from './components/ContactDrawer';
import CollectionSetupModal from './components/CollectionSetupModal';
import BulkActionBar from './components/BulkActionBar';
import FolioSection from './components/FolioSection';
import ConfirmationModal from './components/ConfirmationModal';
import ShareModal from './components/ShareModal';
import EnrichmentModal from './components/EnrichmentModal';
import { SearchIcon } from './components/icons/SearchIcon';
import { sampleStores } from './sample-data';
import { mockNotifications } from './mock-data';
import { t } from './utils/localization';
import { LIMITS } from './utils/validation';
import { compareStoreNames, normalizeStoreName, formatDescription } from './utils/textFormatter';
import { generateAestheticImage } from './services/geminiService';
import { getPriceBucket } from './utils/priceMapper';

// Firebase Imports
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
  signInWithPopup,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc
} from './lib/firebase';

type ActiveView = 'collection' | 'folio' | 'brand' | 'social' | 'profile';
type CollectionView = 'grid' | 'map';

export interface StoreFilters {
  search: string;
  tags: string[];
  onSale: boolean;
  priceRanges: string[]; // Stores bucket IDs (low, mid, high, ultra)
  customFields: Record<string, string[]>;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showLanding, setShowLanding] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const [showArchived, setShowArchived] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEnrichmentModalOpen, setIsEnrichmentModalOpen] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [importModalConfig, setImportModalConfig] = useState({
    isOpen: false, mode: 'import' as 'import' | 'append'
  });
  const [generatingImageIds, setGeneratingImageIds] = useState<Set<string>>(new Set());

  const [activeView, setActiveView] = useState<ActiveView>('collection');
  const [collectionView, setCollectionView] = useState<CollectionView>('grid');

  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  const getInitialFiltersFromUrl = (): StoreFilters => {
    try {
      const params = new URLSearchParams(window.location.search);
      const customFields: Record<string, string[]> = {};
      params.forEach((value, key) => {
        if (key.startsWith('cf_')) {
          const fieldName = key.replace('cf_', '').replace(/_/g, ' ');
          customFields[fieldName] = value.split(',').filter(Boolean);
        }
      });
      return {
        search: params.get('q') || '',
        tags: params.get('tags')?.split(',').filter(Boolean) || [],
        onSale: params.get('sale') === 'true',
        priceRanges: params.get('price')?.split(',').filter(Boolean) || [],
        customFields
      };
    } catch (e) {
      return { search: '', tags: [], onSale: false, priceRanges: [], customFields: {} };
    }
  };

  const [filters, setFilters] = useState<StoreFilters>(getInitialFiltersFromUrl());

  useEffect(() => {
    if (window.location.protocol === 'blob:') return;
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('q', filters.search);
      if ((filters.tags as string[]).length > 0) params.set('tags', (filters.tags as string[]).join(','));
      if (filters.onSale) params.set('sale', 'true');
      if ((filters.priceRanges as string[]).length > 0) params.set('price', (filters.priceRanges as string[]).join(','));

      (Object.entries(filters.customFields) as [string, string[]][]).forEach(([field, values]) => {
        if (values.length > 0) {
          const key = `cf_${field.toLowerCase().replace(/\s+/g, '_')}`;
          params.set(key, values.join(','));
        }
      });
      const paramsString = params.toString();
      const newUrl = `${window.location.pathname}${paramsString ? '?' + paramsString : ''}`;
      if (window.location.search !== (paramsString ? '?' + paramsString : '')) {
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    } catch (e) {
      console.warn("URL State Synchronization is not supported in this environment.");
    }
  }, [filters]);

  const activeCollection = useMemo(() => {
    return collections.find(c => c.id === activeCollectionId) || null;
  }, [collections, activeCollectionId]);

  const selectedStores = useMemo(() => {
    if (!activeCollection) return [];
    return activeCollection.stores.filter(s => selectedStoreIds.has(s.id));
  }, [activeCollection, selectedStoreIds]);

  useEffect(() => {
    if (user && collections.length === 0 && !authLoading) {
      setIsSetupOpen(true);
    }
  }, [user, collections.length, authLoading]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      setAuthLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        let appUser: User;
        if (userSnap.exists()) {
          appUser = userSnap.data() as User;
          if (appUser.activeCollectionId) {
            setActiveCollectionId(appUser.activeCollectionId);
          }
        } else {
          const names = (firebaseUser.displayName || 'User').split(' ');
          appUser = {
            userId: firebaseUser.uid,
            firstName: names[0],
            lastName: names.length > 1 ? names.slice(1).join(' ') : '',
            email: firebaseUser.email || '',
            profilePicture: firebaseUser.photoURL || undefined,
            activeCollectionId: undefined
          };
          await setDoc(userRef, appUser);
        }
        setUser(appUser);
        setShowLanding(false);
        const q = query(collection(db, 'collections'), where("ownerId", "==", firebaseUser.uid));
        const unsubscribeCollections = onSnapshot(q, (snapshot: any) => {
          const syncedCollections: Collection[] = [];
          snapshot.forEach((doc: any) => { syncedCollections.push(doc.data() as Collection); });
          setCollections(syncedCollections);
          if (!activeCollectionId && syncedCollections.length > 0) setActiveCollectionId(syncedCollections[0].id);
        });
        setAuthLoading(false);
        return () => unsubscribeCollections();
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!isFirebaseConfigured) return;
    try { await signInWithPopup(auth, googleProvider); } catch (err) { setLoginError("Could not sign in with Google."); }
  };

  const handleGuestLogin = () => { setUser({ userId: 'guest', firstName: 'Guest', lastName: 'User' }); };

  const saveCollection = async (updatedCollection: Collection) => {
    if (!user) return;
    setCollections(prev => prev.some(c => c.id === updatedCollection.id) ? prev.map(c => c.id === updatedCollection.id ? updatedCollection : c) : [...prev, updatedCollection]);
    if (isFirebaseConfigured && user.userId !== 'guest') { await setDoc(doc(db, 'collections', updatedCollection.id), updatedCollection); }
  };

  const handleRemoveCollection = async (collectionId: string) => {
    if (!user) return;
    setCollections(prev => prev.filter(c => c.id !== collectionId));
    if (activeCollectionId === collectionId) {
      const remaining = collections.filter(c => c.id !== collectionId);
      setActiveCollectionId(remaining.length > 0 ? remaining[0].id : null);
    }
    if (isFirebaseConfigured && user.userId !== 'guest') { await deleteDoc(doc(db, 'collections', collectionId)); }
  };

  const handleSetupComplete = (setupUser: User, collectionType: string, isFirstCollection: boolean) => {
    if (!collectionType) { setIsSetupOpen(false); return; }
    setUser(setupUser);
    if (isFirebaseConfigured && setupUser.userId !== 'guest') { setDoc(doc(db, 'users', setupUser.userId), setupUser, { merge: true }).catch(err => console.error(err)); }
    const template = COLLECTION_TEMPLATES.find(t => t.name === collectionType) || COLLECTION_TEMPLATES[0];
    const newCollection: Collection = { id: crypto.randomUUID(), ownerId: setupUser.userId, name: collectionType, template, stores: [], folios: [], createdAt: new Date().toISOString() };
    saveCollection(newCollection);
    setActiveCollectionId(newCollection.id);
    setIsSetupOpen(false);
  };

  const handleAddStore = (storeData: Partial<Store>) => {
    if (!activeCollection || !user) return;
    const newStore: Store = { ...storeData, id: crypto.randomUUID(), collectionId: activeCollection.id, addedBy: { userId: user.userId, userName: `${user.firstName} ${user.lastName}`.trim() }, favoritedBy: [], privateNotes: [], customFields: {}, rating: 0, priceRange: storeData.priceRange || '', sustainability: '', description: '', country: '', city: '', tags: storeData.tags || [] } as Store;
    saveCollection({ ...activeCollection, stores: [...activeCollection.stores, newStore] });
    setIsAddModalOpen(false);
  };

  const handleEditStore = (updatedStore: Store) => {
    if (!activeCollection) return;
    const updatedStores = activeCollection.stores.map(s => s.id === updatedStore.id ? updatedStore : s);
    saveCollection({ ...activeCollection, stores: updatedStores });
    setEditingStore(null);
  };

  const handleEnrichComplete = (enrichedStores: Store[]) => {
    if (!activeCollection) return;

    const updatedStores = activeCollection.stores.map(s => {
      const enriched = enrichedStores.find(e => e.id === s.id);
      if (!enriched) return s;

      const updated = { ...s };
      const websiteEmpty = !s.website || /^(none|n\/a|na|false)$/i.test(s.website.trim());
      const descEmpty = !s.description || s.description.length < 10 || /^(none|n\/a|na|false)$/i.test(s.description.trim());

      if (enriched.website && websiteEmpty) {
        updated.website = enriched.website;
      }

      if (enriched.description && descEmpty) {
        updated.description = formatDescription(enriched.description);
      }

      return updated;
    });

    saveCollection({ ...activeCollection, stores: updatedStores });
    setIsEnrichmentModalOpen(false);
    setSelectedStoreIds(new Set());
  };

  const handleArchiveStore = (storeId: string, archive: boolean) => {
    if (!activeCollection) return;
    const updatedStores = activeCollection.stores.map(s => s.id === storeId ? { ...s, isArchived: archive } : s);
    saveCollection({ ...activeCollection, stores: updatedStores });
  };

  const handleDeleteStore = (storeId: string) => {
    if (!activeCollection) return;
    const updatedStores = activeCollection.stores.filter(s => s.id !== storeId);
    saveCollection({ ...activeCollection, stores: updatedStores });
    setEditingStore(null);
  };

  const handleFolioAdd = (name: string, themeId: string) => {
    if (!activeCollection) return;
    const newFolio: Folio = { id: crypto.randomUUID(), name, themeId, storeIds: [], createdAt: new Date().toISOString() };
    saveCollection({ ...activeCollection, folios: [...(activeCollection.folios || []), newFolio] });
  };

  const handleDeleteFolio = (folioId: string) => {
    if (!activeCollection) return;
    const updatedFolios = (activeCollection.folios || []).filter(f => f.id !== folioId);
    saveCollection({ ...activeCollection, folios: updatedFolios });
  };

  const handleDropToFolio = (storeId: string, folioId: string) => {
    if (!activeCollection) return;
    const updatedFolios = (activeCollection.folios || []).map(f => f.id === folioId ? { ...f, storeIds: Array.from(new Set([...f.storeIds, storeId])) } : f);
    saveCollection({ ...activeCollection, folios: updatedFolios });
  };

  const handleSyncFolioStores = (folioId: string, storeIds: string[]) => {
    if (!activeCollection) return;
    const updatedFolios = (activeCollection.folios || []).map(f => f.id === folioId ? { ...f, storeIds } : f);
    saveCollection({ ...activeCollection, folios: updatedFolios });
  };

  const handleRemoveFromFolio = (storeId: string, folioId: string) => {
    if (!activeCollection) return;
    const updatedFolios = (activeCollection.folios || []).map(f => f.id === folioId ? { ...f, storeIds: f.storeIds.filter(id => id !== storeId) } : f);
    saveCollection({ ...activeCollection, folios: updatedFolios });
  };

  const handleClearFolio = (folioId: string) => {
    if (!activeCollection) return;
    const updatedFolios = (activeCollection.folios || []).map(f => f.id === folioId ? { ...f, storeIds: [] } : f);
    saveCollection({ ...activeCollection, folios: updatedFolios });
  };

  const handleGenerateImage = async (storeId: string) => {
    const store = activeCollection?.stores.find(s => s.id === storeId);
    if (!store || !activeCollection) return;
    setGeneratingImageIds(prev => new Set(prev).add(storeId));
    try {
      const base64Data = await generateAestheticImage(store);
      const imageUrl = `data:image/png;base64,${base64Data}`;
      const updatedStores = activeCollection.stores.map(s => s.id === storeId ? { ...s, imageUrl } : s);
      saveCollection({ ...activeCollection, stores: updatedStores });
    } catch (err) { console.error(err); } finally { setGeneratingImageIds(prev => { const next = new Set(prev); next.delete(storeId); return next; }); }
  };

  const handleBulkAddToFolio = (folioId: string) => {
    if (!activeCollection) return;
    const updatedFolios = (activeCollection.folios || []).map(f => f.id === folioId ? { ...f, storeIds: Array.from(new Set([...f.storeIds, ...Array.from(selectedStoreIds)])) } : f);
    saveCollection({ ...activeCollection, folios: updatedFolios });
    setSelectedStoreIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedStoreIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const executeBulkDelete = async () => {
    if (!activeCollection || !user) return;
    const updatedStores = activeCollection.stores.filter(s => !selectedStoreIds.has(s.id));

    const updatedFolios = (activeCollection.folios || []).map(f => ({
      ...f,
      storeIds: f.storeIds.filter(id => !selectedStoreIds.has(id))
    }));

    await saveCollection({
      ...activeCollection,
      stores: updatedStores,
      folios: updatedFolios
    });

    setSelectedStoreIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleAcceptShare = (notification: AppNotification) => {
    if (notification.payload?.store && activeCollection) {
      handleAddStore(notification.payload.store);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
  };

  const filteredStores = useMemo(() => {
    if (!activeCollection) return [];
    return activeCollection.stores.filter(store => {
      if (showArchived && !store.isArchived) return false;
      if (!showArchived && store.isArchived) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = store.store_name.toLowerCase().includes(q);
        const matchesCity = store.city.toLowerCase().includes(q);
        const matchesTags = store.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesTags) return false;
      }

      if (filters.onSale && !store.onSale) return false;

      if (filters.priceRanges.length > 0) {
        const bucket = getPriceBucket(store.priceRange);
        if (!filters.priceRanges.includes(bucket)) return false;
      }

      if (filters.tags.length > 0) {
        if (!filters.tags.every(tag => store.tags.includes(tag))) return false;
      }

      // Fix: Cast Object.entries to provide explicit types for values array and avoid 'unknown' errors
      for (const [field, values] of Object.entries(filters.customFields) as [string, string[]][]) {
        if (values.length > 0) {
          const storeVals = store.customFields[field] || [];
          if (!values.some(v => storeVals.includes(v))) return false;
        }
      }

      return true;
    }).sort((a, b) => compareStoreNames(a.store_name, b.store_name));
  }, [activeCollection, filters, showArchived]);

  const handleExport = (stores: Store[], filename: string) => {
    const headers = ["Store Name", "Website", "Instagram", "City", "Country", "Tags", "Description"];
    const csvContent = [
      headers.join(","),
      ...stores.map(s => [
        `"${s.store_name}"`,
        `"${s.website}"`,
        `"${s.instagram_name}"`,
        `"${s.city}"`,
        `"${s.country}"`,
        `"${s.tags.join("|")}"`,
        `"${s.description.replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleClearCollection = (collectionId: string) => {
    const target = collections.find(c => c.id === collectionId);
    if (target) saveCollection({ ...target, stores: [] });
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showLanding && !user) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  if (!user) {
    return (
      <LoginModal
        onLogin={handleLogin}
        onGuestLogin={handleGuestLogin}
        isLoading={authLoading}
        error={loginError}
      />
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-1000"
      style={{
        background: theme.background,
        color: theme.textPrimary,
        // @ts-ignore - Injecting CSS variables
        '--text-on-surface-primary': theme.textOnSurfacePrimary,
        '--text-on-surface-secondary': theme.textOnSurfaceSecondary
      } as React.CSSProperties}
    >
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        <Header
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          unreadBrand={notifications.filter(n => n.type === 'brand' && !n.read).length}
          unreadSocial={notifications.filter(n => n.type === 'social' && !n.read).length}
          backgroundColor={theme.background}
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSwitchCollection={setActiveCollectionId}
          onCreateCollection={() => setIsSetupOpen(true)}
          onContactClick={() => setIsContactOpen(true)}
          theme={theme}
        />

        <div className="flex gap-10">
          {activeCollection && (
            <DynamicFilterSidebar
              isOpen={isFilterPanelOpen}
              collection={activeCollection}
              filteredStores={filteredStores}
              filters={filters}
              onFilterChange={setFilters}
              collectionView={collectionView}
              onCollectionViewChange={setCollectionView}
              onClose={() => setIsFilterPanelOpen(false)}
            />
          )}

          <main className="flex-grow min-w-0">
            {activeView === 'collection' && activeCollection && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsFilterPanelOpen(true)}
                      className="p-3 bg-brand-surface rounded-xl border border-brand-border shadow-subtle hover:shadow-subtle-hover transition-all"
                    >
                      <SearchIcon />
                    </button>
                    <div>
                      <h2 className="text-3xl font-display font-bold leading-tight">{activeCollection.name}</h2>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                        {filteredStores.length} Items in Archive
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      Add Brand
                    </button>
                  </div>
                </div>

                {collectionView === 'grid' ? (
                  <StoreList
                    stores={filteredStores}
                    user={user}
                    theme={theme}
                    collections={collections}
                    onEdit={setEditingStore}
                    onArchive={(id) => handleArchiveStore(id, true)}
                    onRestore={(id) => handleArchiveStore(id, false)}
                    onDeletePermanently={handleDeleteStore}
                    isArchivedView={showArchived}
                    hasActiveFilters={!!filters.search || filters.tags.length > 0 || filters.onSale}
                    selectedStoreIds={selectedStoreIds}
                    onToggleSelection={(id) => {
                      const next = new Set(selectedStoreIds);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      setSelectedStoreIds(next);
                    }}
                    generatingImageIds={generatingImageIds}
                    onGenerateImage={handleGenerateImage}
                    scrapingStoreIds={new Set()}
                  />
                ) : (
                  <MapView
                    stores={filteredStores}
                    onClose={() => setCollectionView('grid')}
                  />
                )}
              </>
            )}

            {activeView === 'folio' && activeCollection && (
              <FolioSection
                folios={activeCollection.folios || []}
                stores={activeCollection.stores}
                onAddFolio={handleFolioAdd}
                onDeleteFolio={handleDeleteFolio}
                onSyncFolio={handleSyncFolioStores}
                theme={theme}
                onRemoveFromFolio={handleRemoveFromFolio}
                onClearFolio={handleClearFolio}
              />
            )}

            {activeView === 'brand' && (
              <NotificationsPage
                title="Brands Activity"
                notifications={notifications.filter(n => n.type === 'brand')}
                onMarkAllAsRead={handleMarkAllAsRead}
                theme={theme}
              />
            )}

            {activeView === 'social' && (
              <NotificationsPage
                title="Social Feed"
                notifications={notifications.filter(n => n.type === 'social')}
                onMarkAllAsRead={handleMarkAllAsRead}
                onAcceptShare={handleAcceptShare}
                theme={theme}
              />
            )}

            {activeView === 'profile' && (
              <ProfilePage
                user={user}
                onUpdateUser={setUser}
                theme={theme}
                onSetTheme={setTheme}
                collections={collections}
                onOpenImportModal={(mode) => setImportModalConfig({ isOpen: true, mode })}
                onAddStoreClick={() => setIsAddModalOpen(true)}
                onLoadSampleData={() => {
                  if (activeCollection) {
                    const newStores = sampleStores.map(s => ({
                      ...s,
                      id: crypto.randomUUID(),
                      collectionId: activeCollection.id,
                      addedBy: { userId: user.userId, userName: user.firstName }
                    })) as Store[];
                    saveCollection({ ...activeCollection, stores: [...activeCollection.stores, ...newStores] });
                  }
                }}
                onClearCollection={handleClearCollection}
                onRemoveCollection={handleRemoveCollection}
              />
            )}
          </main>
        </div>
      </div>

      <BulkActionBar
        count={selectedStoreIds.size}
        selectedStores={selectedStores}
        folios={activeCollection?.folios || []}
        onClear={() => setSelectedStoreIds(new Set())}
        onAddToFolio={handleBulkAddToFolio}
        onShare={() => setIsShareModalOpen(true)}
        onDelete={handleBulkDelete}
        onEnrich={() => setIsEnrichmentModalOpen(true)}
        theme={theme}
      />

      {isAddModalOpen && (
        <AddStoreModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddStore={handleAddStore}
          existingStores={activeCollection?.stores || []}
          onUpdateStore={handleEditStore}
        />
      )}

      {editingStore && (
        <EditModal
          store={editingStore}
          user={user}
          onSave={handleEditStore}
          onClose={() => setEditingStore(null)}
          onDelete={handleDeleteStore}
          collectionTemplate={activeCollection!.template}
          theme={theme}
          allCollectionStores={activeCollection!.stores}
          onSelectStore={setEditingStore}
        />
      )}

      {isSetupOpen && (
        <CollectionSetupModal
          isOpen={isSetupOpen}
          currentUser={user}
          currentCollectionCount={collections.length}
          isFirstCollection={collections.length === 0}
          onSetupComplete={handleSetupComplete}
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          allStores={activeCollection?.stores || []}
          selectedStoreIds={selectedStoreIds}
          onExport={handleExport}
          onSearchUsers={async () => []}
          onSendShare={async () => { }}
        />
      )}

      {isEnrichmentModalOpen && (
        <EnrichmentModal
          isOpen={isEnrichmentModalOpen}
          onClose={() => setIsEnrichmentModalOpen(false)}
          selectedStores={selectedStores}
          onComplete={handleEnrichComplete}
          theme={theme}
        />
      )}

      {importModalConfig.isOpen && (
        <ImportModal
          isOpen={importModalConfig.isOpen}
          mode={importModalConfig.mode}
          onClose={() => setImportModalConfig({ ...importModalConfig, isOpen: false })}
          collections={collections}
          activeCollectionId={activeCollectionId}
          onComplete={(stores, collectionId) => {
            const target = collections.find(c => c.id === collectionId);
            if (target) {
              const formatted = stores.map(s => ({
                ...s,
                collectionId,
                addedBy: { userId: user.userId, userName: user.firstName },
                favoritedBy: [],
                privateNotes: []
              })) as Store[];

              if (importModalConfig.mode === 'import') {
                saveCollection({ ...target, stores: formatted });
              } else {
                saveCollection({ ...target, stores: [...target.stores, ...formatted] });
              }
            }
            setImportModalConfig({ ...importModalConfig, isOpen: false });
          }}
        />
      )}

      {isBulkDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={executeBulkDelete}
          title="Bulk Delete"
          message={`Are you sure you want to permanently delete ${selectedStoreIds.size} selected brands? This action is irreversible.`}
          confirmVariant="danger"
          confirmButtonText="Delete Brands"
        />
      )}

      <ContactDrawer
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        theme={theme}
      />
    </div>
  );
};

export default App;