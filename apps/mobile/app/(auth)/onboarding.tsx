import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import AnimatedPressable from '../../src/components/AnimatedPressable';
import { appAssets } from '../../src/theme/appAssets';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    image: appAssets.onboardingTrackMatches,
    title: 'Track Your Matches',
    subtitle:
      'Log singles & doubles matches with friends, track scores, and build your match history.',
    bg: (primary: string) => primary,
  },
  {
    image: appAssets.onboardingGainXp,
    title: 'Level Up & Earn XP',
    subtitle:
      'Every match earns XP. Watch your circular progress fill up as you climb to the next level.',
    bg: (primary: string, secondary: string) => secondary,
  },
  {
    image: appAssets.onboardingClimbLeaderboard,
    title: 'Climb the Leaderboard',
    subtitle:
      'Compete in ranked matches to raise your rating. See how you stack up against friends and players worldwide.',
    bg: (primary: string) => primary,
  },
  {
    image: appAssets.onboardingUnlockAchievements,
    title: 'Unlock Achievements',
    subtitle:
      'Complete challenges, earn badges, and show off your pickleball milestones. Ready to start your adventure?',
    bg: (primary: string, secondary: string) => secondary,
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => {
          const bgColor = slide.bg(colors.primary, colors.secondary);
          return (
            <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={[styles.illustrationArea, { backgroundColor: bgColor }]}>
                <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
              </View>
              <View style={styles.textArea}>
                <Text style={[styles.slideTitle, { color: colors.ink }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.slideSubtitle, { color: colors.muted }]}>
                  {slide.subtitle}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom controls */}
      <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.controls}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <AnimatedPressable onPress={finish}>
            <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={goNext}
          >
            <Text style={[styles.nextButtonText, { color: colors.textOnPrimary }]}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: radii.xl + 8,
    borderBottomRightRadius: radii.xl + 8,
  },
  slideImage: {
    width: 140,
    height: 140,
  },
  textArea: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  slideTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: typography.sizes.md,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Controls
  controls: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  nextButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    ...shadows.sm,
  },
  nextButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
