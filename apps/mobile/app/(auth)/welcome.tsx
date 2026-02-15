import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '../../src/components/AnimatedPressable';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Hero area with primary background */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[styles.hero, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.heroEmoji}>🏓</Text>
          <Text style={styles.heroTitle}>My Pickleball{'\n'}Adventure</Text>
          <Text style={styles.heroSubtitle}>
            Track matches, level up, and climb the leaderboards.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.actions}>
          <Link href="/(auth)/register" asChild>
            <AnimatedPressable
              style={[styles.button, styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
                Create account
              </Text>
            </AnimatedPressable>
          </Link>
          <Link href="/(auth)/login" asChild>
            <AnimatedPressable
              style={[
                styles.button,
                styles.secondaryBtn,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.ink }]}>
                Sign in
              </Text>
            </AnimatedPressable>
          </Link>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: radii.xl + 12,
    borderBottomRightRadius: radii.xl + 12,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  heroEmoji: {
    fontSize: 72,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl + 4,
    fontWeight: typography.weights.heavy,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: typography.sizes.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  button: {
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  primaryBtn: {},
  secondaryBtn: {
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
