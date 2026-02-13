import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AuthGate from '../src/components/AuthGate';
import { AuthProvider } from '../src/state/auth';
import { colors } from '../src/theme';
import { usePushNotificationHandler } from '../src/hooks/usePushNotificationHandler';

function AppContent() {
  usePushNotificationHandler();
  
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </AuthProvider>
  );
}
