import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = segments[0] === 'login';

    // Debug logic for Phase 2 verification
    console.log(`[Auth Check] User: ${!!user}, Segment: ${segments[0]}`);

    if (!user && !isLoginPage) {
      // If user is not signed in and not on login page, redirect to login
      router.replace('/login');
    } else if (user && isLoginPage) {
      // If user is signed in but on login page, redirect to home
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);
}
