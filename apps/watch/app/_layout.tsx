import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import ErrorBoundary from '../src/components/ErrorBoundary';
import { AuthProvider } from '../src/state/auth';
import { watchColors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: watchColors.background },
          }}
        >
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}