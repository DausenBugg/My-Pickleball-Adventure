import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../state/auth';
import { useTheme } from '../theme';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  // Check if onboarding has been seen
  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      setHasSeenOnboarding(value === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (loading || !onboardingChecked) return;

    const inAuth = segments[0] === '(auth)';

    if (!session && !inAuth) {
      if (!hasSeenOnboarding) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(auth)/welcome');
      }
    }

    if (session && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [loading, router, segments, session, onboardingChecked, hasSeenOnboarding]);

  if (loading || !onboardingChecked) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
