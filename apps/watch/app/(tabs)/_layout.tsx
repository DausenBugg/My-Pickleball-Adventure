import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '../../src/state/auth';

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#9FB2D8',
        tabBarStyle: {
          backgroundColor: '#121B2E',
          borderTopColor: '#24324A',
          height: 48,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        sceneStyle: { backgroundColor: '#0B1220' },
      }}
    >
      <Tabs.Screen name="log-match" options={{ title: 'Log' }} />
      <Tabs.Screen name="approvals" options={{ title: 'Approvals' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}