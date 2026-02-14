import { ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { AppScreen, GlassCard, GradientHeader, PrimaryButton } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme';

export default function RegisterScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

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
  const confirmValid = useMemo(
    () => confirmPassword === password && password.length > 0,
    [confirmPassword, password]
  );
  const canSubmit = nameValid && emailValid && passwordValid && confirmValid;

  const validationErrors = useMemo(() => {
    if (!submitted) return [];
    const errors: string[] = [];
    if (!nameValid) errors.push('Name must be at least 2 characters.');
    if (!emailValid) errors.push('Enter a valid email address.');
    if (!passwordValid) errors.push('Password must be at least 8 characters.');
    if (!confirmValid && confirmPassword.length > 0) errors.push('Passwords must match.');
    if (confirmPassword.length === 0 && password.length > 0) errors.push('Confirm your password.');
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

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setNotice('Account created successfully. Redirecting...');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSubmitted(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (next: string) => void,
    placeholder: string,
    options?: {
      secure?: boolean;
      keyboardType?: 'default' | 'email-address';
      autoCapitalize?: 'none' | 'words';
      right?: ReactNode;
      invalid?: boolean;
    }
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }]}>
        {label}
      </Text>
      <View style={styles.passwordRow}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.color.role.textMuted}
          secureTextEntry={options?.secure}
          keyboardType={options?.keyboardType}
          autoCapitalize={options?.autoCapitalize ?? 'none'}
          style={[
            styles.input,
            {
              flex: 1,
              borderColor: options?.invalid ? theme.color.role.secondary : theme.color.role.border,
              backgroundColor: theme.color.role.surfaceAlt,
              color: theme.color.role.textPrimary,
              fontFamily: theme.type.family.body,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
        />
        {options?.right}
      </View>
    </View>
  );

  return (
    <AppScreen>
      <GradientHeader title="Create Your Account" subtitle="Start logging matches and climbing the rankings." />

      <GlassCard style={{ gap: theme.spacing.md }}>
        {renderInput('Name', name, setName, 'Jordan Lee', {
          autoCapitalize: 'words',
          invalid: submitted && !nameValid,
        })}
        {renderInput('Email', email, setEmail, 'you@example.com', {
          keyboardType: 'email-address',
          invalid: submitted && !emailValid,
        })}
        {renderInput('Password', password, setPassword, 'At least 8 characters', {
          secure: !showPassword,
          invalid: submitted && !passwordValid,
          right: (
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={[
                styles.toggle,
                {
                  minHeight: 44,
                  minWidth: 44,
                  borderColor: theme.color.role.border,
                  backgroundColor: theme.color.role.surfaceAlt,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.color.role.textSecondary}
              />
            </Pressable>
          ),
        })}
        {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'Re-enter password', {
          secure: !showConfirm,
          invalid: submitted && !confirmValid,
          right: (
            <Pressable
              onPress={() => setShowConfirm((prev) => !prev)}
              style={[
                styles.toggle,
                {
                  minHeight: 44,
                  minWidth: 44,
                  borderColor: theme.color.role.border,
                  backgroundColor: theme.color.role.surfaceAlt,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.color.role.textSecondary}
              />
            </Pressable>
          ),
        })}

        {validationErrors.length > 0 ? (
          <View
            style={{
              backgroundColor: theme.color.role.secondarySoft,
              borderRadius: theme.radius.md,
              padding: theme.spacing.sm,
              gap: 6,
            }}
          >
            {validationErrors.map((issue) => (
              <Text
                key={issue}
                style={{
                  color: theme.color.role.secondary,
                  fontSize: theme.type.sizes.sm,
                  fontFamily: theme.type.family.bodySemi,
                }}
              >
                {issue}
              </Text>
            ))}
          </View>
        ) : null}

        <PrimaryButton label="Create account" loading={loading} onPress={handleRegister} />

        <Text
          style={{
            color: theme.color.role.textMuted,
            textAlign: 'center',
            fontSize: theme.type.sizes.sm,
            fontFamily: theme.type.family.body,
          }}
        >
          By continuing you agree to our Terms and Privacy Policy.
        </Text>

        {error ? (
          <Text style={{ color: theme.color.role.secondary, textAlign: 'center', fontFamily: theme.type.family.bodySemi }}>
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text style={{ color: theme.color.role.primary, textAlign: 'center', fontFamily: theme.type.family.bodySemi }}>
            {notice}
          </Text>
        ) : null}
      </GlassCard>

      <Pressable onPress={() => router.push('/(auth)/login')}>
        <Text
          style={{
            textAlign: 'center',
            color: theme.color.role.primary,
            fontSize: theme.type.sizes.base,
            fontFamily: theme.type.family.bodySemi,
          }}
        >
          Already have an account? Sign in
        </Text>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggle: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
