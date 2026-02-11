import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AuthGate from '../src/components/AuthGate';
import { AuthProvider } from '../src/state/auth';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AuthGate>
    </AuthProvider>
  );
}
