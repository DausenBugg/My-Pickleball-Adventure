import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '../../src/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>My Pickleball Adventure</Text>
          <Text style={styles.subtitle}>
            Track matches, level up, and climb the leaderboards.
          </Text>
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
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    justifyContent: 'space-between',
  },
  hero: {
    gap: 12,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.blue,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: colors.ink,
  },
});
