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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const nameValid = useMemo(() => name.trim().length >= 2, [name]);
  const emailValid = useMemo(() => email.includes('@') && email.includes('.'), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const confirmValid = useMemo(() => confirmPassword === password && password.length > 0, [confirmPassword, password]);
  const canSubmit = nameValid && emailValid && passwordValid && confirmValid;

  const validationErrors = useMemo(() => {
    if (!submitted) return [];
    const errors: string[] = [];
    if (!nameValid) errors.push('Name must be at least 2 characters');
    if (!emailValid) errors.push('Enter a valid email address');
    if (!passwordValid) errors.push('Password must be at least 8 characters');
    if (!confirmValid && confirmPassword.length > 0) errors.push('Passwords must match');
    if (confirmPassword.length === 0 && password.length > 0) errors.push('Confirm your password');
    return errors;
  }, [submitted, nameValid, emailValid, passwordValid, confirmValid, confirmPassword, password]);

  const handleRegister = async () => {
    setSubmitted(true);
    setError('');
    setNotice('');

    if (!canSubmit) return;
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured yet. Add your keys to run auth.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      console.log('Signup response:', { data, error: signUpError });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Account created successfully
        setNotice('Account created successfully! Logging you in...');
        
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSubmitted(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>NEW PLAYER</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Set up your profile and start logging matches.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Jordan Lee"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.muted}
            />
          </View>
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
                textContentType="newPassword"
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
          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                secureTextEntry={!showConfirm}
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor={colors.muted}
              />
              <Pressable
                onPress={() => setShowConfirm((prev) => !prev)}
                style={styles.passwordToggle}
              >
                <Text style={styles.passwordToggleText}>
                  {showConfirm ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          {validationErrors.length > 0 ? (
            <View style={styles.validationErrors}>
              {validationErrors.map((err, idx) => (
                <Text key={idx} style={styles.validationError}>
                  • {err}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            style={[styles.primary, !canSubmit && styles.primaryDisabled]}
            onPress={handleRegister}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryText}>Create account</Text>
            )}
          </Pressable>
          <Text style={styles.termsText}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        </View>

        <Link href="/(auth)/login" style={styles.link}>
          Already have an account? Sign in
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
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: colors.coralSoft,
    top: -60,
    right: -60,
  },
  backgroundBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 160,
    backgroundColor: colors.blueSoft,
    bottom: -90,
    left: -70,
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
    backgroundColor: colors.coralSoft,
  },
  passwordToggleText: {
    color: colors.coralDark,
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: typography.families.semibold,
  },
  validationErrors: {
    backgroundColor: colors.coralSoft,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ffd1ca',
  },
  validationError: {
    color: colors.coral,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.medium,
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
  termsText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: typography.families.regular,
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
  noticeText: {
    color: colors.blueDark,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: typography.families.medium,
  },
});
