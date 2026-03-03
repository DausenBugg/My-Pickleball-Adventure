import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../src/state/auth';
import { watchColors } from '../../src/theme/colors';

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: watchColors.tabBarActive,
        tabBarInactiveTintColor: watchColors.tabBarInactive,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: watchColors.background,
          borderTopColor: watchColors.background,
          height: 36,
          marginHorizontal: 40,
          marginBottom: 5,
          borderRadius: 8,
        },
        tabBarIconStyle: { marginTop: 0 },
        sceneStyle: { backgroundColor: watchColors.background },
      }}
    >
      <Tabs.Screen
        name="log-match"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-done-circle-outline" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}