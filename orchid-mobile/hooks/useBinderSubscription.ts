import { useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { FIREBASE_DB } from '@/config/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBinderStore } from '@/stores/useBinderStore';
import { Binder } from '@/types/models';

export function useBinderSubscription() {
  const user = useAuthStore((s) => s.user);
  const { setBinders, setLoading } = useBinderStore();

  useEffect(() => {
    if (!user) {
      setBinders([]);
      return;
    }

    // MOCK/GUEST DATA BYPASS
    if (user.uid === 'guest-user-123' || user.uid === 'mock-user-123') {
      console.log(`[BinderSubscription] Loading Mock Data for ${user.uid}`);
      setLoading(true);
      setTimeout(() => {
        setBinders([
          {
            id: 'mock-1',
            name: 'Spring Collections',
            ownerId: user.uid,
            participants: [user.uid],
            isShared: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
            description: 'Curated picks for the upcoming season.'
          },
          {
            id: 'mock-2',
            name: 'Interior Aesthetics',
            ownerId: user.uid,
            participants: [user.uid],
            isShared: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
            description: 'Minimalist furniture and decor ideas.'
          },
          {
            id: 'mock-3',
            name: 'Tech Essentials',
            ownerId: user.uid,
            participants: [user.uid],
            isShared: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            coverImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2101&auto=format&fit=crop',
            description: 'Gear for the home office.'
          }
        ]);
        setLoading(false);
      }, 800);
      return;
    }

    setLoading(true);

    // Architecture Decision: Querying by 'participants' array-contains user.uid
    // This supports both private (owner only) and shared binders efficiently.
    const q = query(
      collection(FIREBASE_DB, 'binders'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    console.log(`[Firestore] Subscribing to binders for user: ${user.uid}`);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const binders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Binder[];

      console.log(`[Firestore] Synced ${binders.length} binders`);
      setBinders(binders);
      setLoading(false);
    }, (error) => {
      console.error("[Firestore] Subscription Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
}
