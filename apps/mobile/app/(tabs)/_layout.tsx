import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../src/theme';

function FloatingMatchButton() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-match');
  };

  return (
    <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: insets.bottom + 20 }]}>
      <Pressable
        accessibilityLabel="Add match"
        accessibilityRole="button"
        onPress={handlePress}
        style={[
          styles.fab,
          {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.color.role.secondary,
            borderColor: theme.color.role.surface,
          },
          theme.elevation.lg,
        ]}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>
      <Text
        style={{
          marginTop: 6,
          color: theme.color.role.textSecondary,
          fontSize: theme.type.sizes.xs,
          fontFamily: theme.type.family.bodySemi,
        }}
      >
        Add Match
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.color.role.primary,
          tabBarInactiveTintColor: theme.color.role.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: Math.max(10, insets.bottom + 2),
            height: 72,
            paddingBottom: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderRadius: 24,
            borderTopColor: theme.color.role.tabBarBorder,
            backgroundColor: theme.color.role.tabBar,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: theme.type.family.bodySemi,
          },
          tabBarIcon: ({ color, focused }) => {
            const icon: Record<string, keyof typeof Ionicons.glyphMap> = {
              home: focused ? 'home' : 'home-outline',
              search: focused ? 'search' : 'search-outline',
              leaderboard: focused ? 'trophy' : 'trophy-outline',
              settings: focused ? 'person' : 'person-outline',
            };
            return <Ionicons name={icon[route.name] || 'ellipse'} size={20} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        <Tabs.Screen
          name="add-match"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <FloatingMatchButton />
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
