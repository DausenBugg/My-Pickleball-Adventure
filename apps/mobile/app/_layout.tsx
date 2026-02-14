import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import AuthGate from '../src/components/AuthGate';
import { AuthProvider } from '../src/state/auth';
import { ThemeProvider, useAppTheme, useThemeFonts } from '../src/theme';

import { usePushNotificationHandler } from '../src/hooks/usePushNotificationHandler';

function AppShell() {
  usePushNotificationHandler();
  const { theme, isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.role.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-match"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

function RootContent() {
  const fontsLoaded = useThemeFonts();
  const { theme } = useAppTheme();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.color.role.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.color.role.primary} />
      </View>
    );
  }

  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
