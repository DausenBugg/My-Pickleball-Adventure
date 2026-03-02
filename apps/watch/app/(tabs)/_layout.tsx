import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../src/state/auth';
import { watchColors } from '../../src/theme/colors';
import { watchSizing } from '../../src/theme/sizing';

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
        tabBarStyle: {
          backgroundColor: watchColors.tabBarBackground,
          borderTopColor: watchColors.primaryDark,
          height: watchSizing.tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: watchSizing.tabLabel,
          fontWeight: '600',
        },
        sceneStyle: { backgroundColor: watchColors.background },
      }}
    >
      <Tabs.Screen
        name="log-match"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Review',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Prefs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}