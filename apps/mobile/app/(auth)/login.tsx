import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';
import AnimatedPressable from '../../src/components/AnimatedPressable';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const emailValid = useMemo(() => email.includes('@') && email.includes('.'), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const canSubmit = emailValid && passwordValid;

  const helperText = submitted && !canSubmit
    ? 'Enter a valid email and at least 8 characters.'
    : 'Use the email you registered with.';

  const handleSignIn = async () => {
    setSubmitted(true);
    setError('');

    if (!canSubmit) return;
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured yet. Add your keys to run auth.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Sign in to your account.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.ink }]}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.ink }]}
                value={password}
                onChangeText={setPassword}
              />
              <AnimatedPressable
                onPress={() => setShowPassword((prev) => !prev)}
                style={[styles.passwordToggle, { backgroundColor: colors.borderLight }]}
              >
                <Text style={[styles.passwordToggleText, { color: colors.ink }]}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </AnimatedPressable>
            </View>
          </View>

          <Text style={[styles.helper, { color: colors.muted }, submitted && !canSubmit && { color: colors.secondary }]}>
            {helperText}
          </Text>

          <AnimatedPressable
            style={[styles.primary, { backgroundColor: colors.primary }, !canSubmit && { opacity: 0.5 }]}
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryText}>Sign in</Text>
            )}
          </AnimatedPressable>

          {error ? <Text style={[styles.errorText, { color: colors.secondary }]}>{error}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Link href="/(auth)/register" style={[styles.link, { color: colors.primary }]}>
            No account yet? Create one
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.base,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: typography.sizes.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    fontSize: typography.sizes.base,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
  passwordToggleText: {
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  helper: {
    fontSize: 12,
  },
  primary: {
    borderRadius: radii.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.md,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 12,
  },
});
