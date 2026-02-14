import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '../../src/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>SKY LEAGUE</Text>
          <Text style={styles.title}>My Pickleball Adventure</Text>
          <Text style={styles.subtitle}>
            Track matches, light up your streaks, and climb the retro rankings.
          </Text>
        </View>

        <View style={styles.featureStrip}>
          <View style={styles.featureCard}>
            <Text style={styles.featureValue}>2 min</Text>
            <Text style={styles.featureLabel}>Match log</Text>
          </View>
          <View style={[styles.featureCard, styles.featureCardAlt]}>
            <Text style={styles.featureValue}>Live</Text>
            <Text style={styles.featureLabel}>Ratings</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureValue}>Crew</Text>
            <Text style={styles.featureLabel}>Approvals</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Link href="/(auth)/register" asChild>
            <Pressable style={[styles.button, styles.primary]}>
              <Text style={[styles.buttonText, styles.primaryText]}>
                Create account
              </Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/login" asChild>
            <Pressable style={[styles.button, styles.secondary]}>
              <Text style={[styles.buttonText, styles.secondaryText]}>
                Sign in
              </Text>
            </Pressable>
          </Link>
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
  backgroundTop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 140,
    backgroundColor: colors.blueSoft,
    top: -60,
    right: -40,
  },
  backgroundBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 160,
    backgroundColor: colors.coralSoft,
    bottom: -80,
    left: -60,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    justifyContent: 'space-between',
  },
  hero: {
    gap: 14,
    marginTop: 20,
  },
  kicker: {
    fontSize: typography.sizes.xs,
    letterSpacing: 2.4,
    color: colors.muted,
    fontFamily: typography.families.semibold,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    fontFamily: typography.families.bold,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.muted,
    lineHeight: 24,
    fontFamily: typography.families.regular,
  },
  featureStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  featureCardAlt: {
    backgroundColor: colors.panel,
  },
  featureValue: {
    fontSize: typography.sizes.lg,
    color: colors.blueDark,
    fontFamily: typography.families.bold,
  },
  featureLabel: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    fontFamily: typography.families.medium,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.blue,
  },
  secondary: {
    backgroundColor: colors.coral,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.families.semibold,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
});
