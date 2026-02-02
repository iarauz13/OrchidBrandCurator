import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBinderStore } from '@/stores/useBinderStore';

export default function InviteHandler() {
  const { params } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { joinBinder } = useBinderStore();

  useEffect(() => {
    async function handleInvite() {
      // Param structure: orchid://invite/binder/123 -> params = ["binder", "123"]
      // Verify path segments
      const segments = Array.isArray(params) ? params : [params];

      if (segments[0] === 'binder' && segments[1]) {
        const binderId = segments[1];

        if (!user) {
          // Not logged in -> Redirect to login with return path
          // For MVP, just go to login. We lose the invite context unless we store it.
          // Improvement: Store invite in AsyncStorage before redirect.
          router.replace('/(auth)/login');
          return;
        }

        try {
          // Attempt to join
          await joinBinder(binderId, user.uid);
          // Redirect to the binder
          router.replace(`/binder/${binderId}`);
        } catch (error) {
          console.error("Failed to join binder:", error);
          router.replace('/(tabs)/');
        }
      } else {
        // Invalid link
        router.replace('/(tabs)/');
      }
    }

    handleInvite();
  }, [params, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Joining Binder...</Text>
    </View>
  );
}
