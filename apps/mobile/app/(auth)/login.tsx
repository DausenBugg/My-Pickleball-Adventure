import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>PLAYER ACCESS</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in and keep the rally going.</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={colors.muted}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.passwordToggle}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.helper, submitted && !canSubmit && styles.helperError]}>
            {helperText}
          </Text>

          <Pressable
            style={[styles.primary, !canSubmit && styles.primaryDisabled]}
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryText}>Sign in</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <Link href="/(auth)/register" style={styles.link}>
          No account yet? Create one
        </Link>
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
    width: 200,
    height: 200,
    borderRadius: 120,
    backgroundColor: colors.blueSoft,
    top: -40,
    right: -40,
  },
  backgroundBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 160,
    backgroundColor: colors.coralSoft,
    bottom: -80,
    left: -80,
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
  kicker: {
    fontSize: typography.sizes.xs,
    letterSpacing: 2.2,
    color: colors.muted,
    fontFamily: typography.families.semibold,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.families.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.muted,
    fontFamily: typography.families.regular,
  },
  formCard: {
    gap: 16,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: typography.sizes.sm,
    letterSpacing: 1.2,
    color: colors.muted,
    fontFamily: typography.families.semibold,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    fontFamily: typography.families.regular,
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
    borderRadius: radii.sm,
    backgroundColor: colors.blueSoft,
  },
  passwordToggleText: {
    color: colors.blueDark,
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: typography.families.semibold,
  },
  helper: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: typography.families.regular,
  },
  helperError: {
    color: colors.coral,
  },
  primary: {
    backgroundColor: colors.blue,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryDisabled: {
    backgroundColor: '#9ad4ff',
  },
  primaryText: {
    color: '#ffffff',
    fontFamily: typography.families.semibold,
    fontSize: 16,
  },
  link: {
    color: colors.blueDark,
    textAlign: 'center',
    fontFamily: typography.families.semibold,
  },
  errorText: {
    color: colors.coral,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: typography.families.medium,
  },
});
