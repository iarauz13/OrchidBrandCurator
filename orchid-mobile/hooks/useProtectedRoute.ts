import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Debug logic for Phase 2 verification
    console.log(`[Auth Check] User: ${!!user}, Segment: ${segments[0]}`);

    if (!user && !inAuthGroup) {
      // If user is not signed in and not in the auth group, redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // If user is signed in but still in auth group (login page), redirect to home
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);
}
