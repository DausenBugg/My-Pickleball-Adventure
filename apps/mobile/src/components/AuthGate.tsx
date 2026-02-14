import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { useAuth } from '../state/auth';
import { useAppTheme } from '../theme';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { theme } = useAppTheme();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!session && !inAuth) {
      router.replace('/(auth)/welcome');
    }

    if (session && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [loading, router, segments, session]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.color.role.background }]}>
        <ActivityIndicator size="large" color={theme.color.role.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
