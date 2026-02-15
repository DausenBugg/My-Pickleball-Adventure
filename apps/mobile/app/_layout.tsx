import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AuthGate from '../src/components/AuthGate';
import { AuthProvider } from '../src/state/auth';
import { ThemeProvider, useTheme } from '../src/theme';
import { usePushNotificationHandler } from '../src/hooks/usePushNotificationHandler';

function AppContent() {
  usePushNotificationHandler();
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <AppContent />
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
