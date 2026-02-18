import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';
import AnimatedPressable from '../../src/components/AnimatedPressable';

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
  const { colors } = useTheme();
  const router = useRouter();

  const nameValid = useMemo(() => name.trim().length >= 2, [name]);
  const emailValid = useMemo(() => email.includes('@') && email.includes('.'), [email]);
  
  // Password complexity: 8+ chars, at least one uppercase, one number
  const passwordValid = useMemo(() => {
    if (password.length < 8) return false;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUppercase && hasNumber;
  }, [password]);
  
  const confirmValid = useMemo(() => confirmPassword === password && password.length > 0, [confirmPassword, password]);
  const canSubmit = nameValid && emailValid && passwordValid && confirmValid;

  const validationErrors = useMemo(() => {
    if (!submitted) return [];
    const errors: string[] = [];
    if (!nameValid) errors.push('Name must be at least 2 characters');
    if (!emailValid) errors.push('Enter a valid email address');
    if (!passwordValid) {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      } else if (!/[A-Z]/.test(password)) {
        errors.push('Password must include an uppercase letter');
      } else if (!/[0-9]/.test(password)) {
        errors.push('Password must include a number');
      }
    }
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
        // Account created - user needs to verify their email
        setNotice(
          '✉️ Account created! Please check your email and click the verification link to complete your registration.'
        );
        
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AnimatedPressable
            style={[styles.backButton, { backgroundColor: colors.borderLight }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </AnimatedPressable>
          <Text style={[styles.title, { color: colors.ink }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Start logging matches and climbing the ranks.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>Name</Text>
            <TextInput
              placeholder="Jordan Lee"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.ink }]}
              value={name}
              onChangeText={setName}
            />
          </View>
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
                textContentType="newPassword"
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
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>Confirm password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showConfirm}
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.ink }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <AnimatedPressable
                onPress={() => setShowConfirm((prev) => !prev)}
                style={[styles.passwordToggle, { backgroundColor: colors.borderLight }]}
              >
                <Text style={[styles.passwordToggleText, { color: colors.ink }]}>
                  {showConfirm ? 'Hide' : 'Show'}
                </Text>
              </AnimatedPressable>
            </View>
          </View>

          {validationErrors.length > 0 ? (
            <View style={[styles.validationErrors, { backgroundColor: colors.secondaryGhost, borderColor: colors.secondary }]}>
              {validationErrors.map((err, idx) => (
                <Text key={idx} style={[styles.validationError, { color: colors.secondary }]}>
                  • {err}
                </Text>
              ))}
            </View>
          ) : null}

          <AnimatedPressable
            style={[styles.primary, { backgroundColor: colors.secondary }, !canSubmit ? { opacity: 0.5 } : {}]}
            onPress={handleRegister}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryText}>Create account</Text>
            )}
          </AnimatedPressable>
          <Text style={[styles.termsText, { color: colors.muted }]}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
          {error ? <Text style={[styles.errorText, { color: colors.secondary }]}>{error}</Text> : null}
          {notice ? <Text style={[styles.noticeText, { color: colors.primary }]}>{notice}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Link href="/(auth)/login" style={[styles.link, { color: colors.primary }]}>
            Already have an account? Sign in
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
  validationErrors: {
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: 6,
    borderWidth: 1,
  },
  validationError: {
    fontSize: typography.sizes.sm,
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
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  link: {
    textAlign: 'center',
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 12,
  },
  noticeText: {
    textAlign: 'center',
    fontSize: 12,
  },
});
