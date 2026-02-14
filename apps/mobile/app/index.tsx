import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../src/theme';

const ONBOARDING_KEY = 'onboardingComplete';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const resolveTarget = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!mounted) return;
        setTarget(seen === 'true' ? '/(auth)/welcome' : '/(auth)/onboarding');
      } catch {
        if (!mounted) return;
        setTarget('/(auth)/welcome');
      }
    };

    resolveTarget();
    return () => {
      mounted = false;
    };
  }, []);

  if (!target) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return <Redirect href={target} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
