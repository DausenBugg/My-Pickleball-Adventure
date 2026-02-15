import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import AnimatedPressable from '../../src/components/AnimatedPressable';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { icon: IoniconsName; activeIcon: IoniconsName; label: string }> = {
  home: { icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  'add-match': { icon: 'add-circle-outline', activeIcon: 'add-circle', label: 'Log Match' },
  search: { icon: 'search-outline', activeIcon: 'search', label: 'Search' },
  leaderboard: { icon: 'trophy-outline', activeIcon: 'trophy', label: 'Ranks' },
  settings: { icon: 'settings-outline', activeIcon: 'settings', label: 'Settings' },
};

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.delay(300).duration(400)}
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.tabBarBackground,
          ...shadows.lg,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name] ?? {
          icon: 'ellipse-outline' as IoniconsName,
          activeIcon: 'ellipse' as IoniconsName,
          label: options.title ?? route.name,
        };
        const isCenter = route.name === 'add-match';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <AnimatedPressable
              key={route.key}
              scaleDown={0.9}
              onPress={onPress}
              style={[
                styles.centerButton,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Ionicons
                name={isFocused ? config.activeIcon : config.icon}
                size={28}
                color={colors.textOnSecondary}
              />
            </AnimatedPressable>
          );
        }

        return (
          <AnimatedPressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={isFocused ? config.activeIcon : config.icon}
              size={22}
              color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
            />
            {isFocused && (
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors.tabBarActive },
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            )}
          </AnimatedPressable>
        );
      })}
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="add-match" options={{ title: 'Add Match' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 18,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: '100%',
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...shadows.md,
  },
});
