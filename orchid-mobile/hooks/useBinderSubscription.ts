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
