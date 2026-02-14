import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '../../src/theme';

const ONBOARDING_KEY = 'onboardingComplete';

const steps = [
  {
    title: 'Welcome to your pickleball era',
    description: 'Track every match, build momentum, and celebrate your streaks.',
    accent: colors.blueSoft,
  },
  {
    title: 'Log matches in seconds',
    description: 'Add opponents, scorelines, and notes without slowing down the vibe.',
    accent: colors.panel,
  },
  {
    title: 'Climb the leaderboards',
    description: 'Watch your rating evolve with every win, plus instant snapshots.',
    accent: colors.coralSoft,
  },
  {
    title: 'Play with your crew',
    description: 'Find friends, track approvals, and keep everyone in the loop.',
    accent: '#fff7e8',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const step = useMemo(() => steps[index], [index]);
  const isLast = index === steps.length - 1;

  useEffect(() => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [animation, index]);

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/welcome');
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
      return;
    }
    setIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.kicker}>MY PICKLEBALL ADVENTURE</Text>
          <Pressable onPress={handleFinish}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.cardFrame}>
          <View style={[styles.cardGlow, { backgroundColor: step.accent }]} />
          <Animated.View
            style={[
              styles.card,
              {
                opacity: animation,
                transform: [{ translateY }],
              },
            ]}
          >
            <Text style={styles.cardTitle}>{step.title}</Text>
            <Text style={styles.cardBody}>{step.description}</Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {steps.map((_, stepIndex) => (
              <View
                key={`dot-${stepIndex}`}
                style={[
                  styles.dot,
                  stepIndex === index ? styles.dotActive : styles.dotIdle,
                ]}
              />
            ))}
          </View>

          <Pressable style={styles.primary} onPress={handleNext}>
            <Text style={styles.primaryText}>
              {isLast ? 'Get started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    fontSize: typography.sizes.xs,
    letterSpacing: 2.2,
    color: colors.muted,
    fontFamily: typography.families.semibold,
  },
  skip: {
    color: colors.blueDark,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.semibold,
  },
  cardFrame: {
    flex: 1,
    justifyContent: 'center',
  },
  cardGlow: {
    position: 'absolute',
    height: 260,
    borderRadius: radii.xl,
    top: 24,
    left: 12,
    right: 12,
    opacity: 0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: typography.sizes.xxl,
    lineHeight: 40,
    color: colors.ink,
    fontFamily: typography.families.bold,
    marginBottom: spacing.sm,
  },
  cardBody: {
    fontSize: typography.sizes.md,
    color: colors.muted,
    lineHeight: 24,
    fontFamily: typography.families.regular,
  },
  footer: {
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: colors.coral,
    width: 24,
  },
  dotIdle: {
    backgroundColor: colors.blueSoft,
  },
  primary: {
    backgroundColor: colors.blue,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: typography.sizes.md,
    fontFamily: typography.families.semibold,
  },
});
