import { Link } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '../../src/components/AnimatedPressable';
import { appAssets } from '../../src/theme/appAssets';
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
          <Image source={appAssets.welcomeHero} style={styles.heroImage} resizeMode="contain" />
          <Text style={styles.heroTitle}>My Pickleball{'\n'}App</Text>
          <View style={styles.featureCards}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Image source={appAssets.welcomeTrack} style={styles.featureImage} resizeMode="contain" />
              </View>
              <Text style={styles.featureLabel}>Track matches</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Image source={appAssets.welcomeLevelUp} style={styles.featureImage} resizeMode="contain" />
              </View>
              <Text style={styles.featureLabel}>Level up</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Image source={appAssets.welcomeLeaderboard} style={styles.featureImage} resizeMode="contain" />
              </View>
              <Text style={styles.featureLabel}>Climb the leaderboards</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.actions}>
          <Link href="/(auth)/register" asChild>
            <AnimatedPressable
              style={[styles.button, styles.primaryBtn, { backgroundColor: colors.ink }]}
            >
              <Text style={[styles.buttonText, { color: colors.ink }]}>
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
  heroImage: {
    width: 400,
    height: 400,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl + 4,
    fontWeight: typography.weights.heavy,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 42,
  },
  featureCards: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.91)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureImage: {
    width: 60,
    height: 60,
  },
  featureLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: typography.weights.medium,
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
