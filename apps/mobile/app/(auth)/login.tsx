import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { AppScreen, GlassCard, GradientHeader, PrimaryButton } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme';

export default function LoginScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailValid = useMemo(() => email.includes('@') && email.includes('.'), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const canSubmit = emailValid && passwordValid;

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
    <AppScreen scrollable={false}>
      <View style={styles.layout}>
        <GradientHeader title="Welcome Back" subtitle="Sign in to keep your streak moving." />

        <GlassCard style={{ gap: theme.spacing.md }}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }]}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={theme.color.role.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              style={[
                styles.input,
                {
                  borderColor: submitted && !emailValid ? theme.color.role.secondary : theme.color.role.border,
                  color: theme.color.role.textPrimary,
                  backgroundColor: theme.color.role.surfaceAlt,
                  fontFamily: theme.type.family.body,
                },
              ]}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="At least 8 characters"
                placeholderTextColor={theme.color.role.textMuted}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    borderColor: submitted && !passwordValid ? theme.color.role.secondary : theme.color.role.border,
                    color: theme.color.role.textPrimary,
                    backgroundColor: theme.color.role.surfaceAlt,
                    fontFamily: theme.type.family.body,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                accessibilityRole="button"
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
            </View>
          </View>

          <Text
            style={{
              color: submitted && !canSubmit ? theme.color.role.secondary : theme.color.role.textMuted,
              fontSize: theme.type.sizes.sm,
              fontFamily: theme.type.family.body,
            }}
          >
            {submitted && !canSubmit
              ? 'Enter a valid email and at least 8 characters.'
              : 'Use the email you registered with.'}
          </Text>

          {error ? (
            <View
              style={{
                borderRadius: theme.radius.md,
                backgroundColor: theme.color.role.secondarySoft,
                padding: theme.spacing.sm,
              }}
            >
              <Text
                style={{
                  color: theme.color.role.secondary,
                  fontSize: theme.type.sizes.sm,
                  fontFamily: theme.type.family.bodySemi,
                }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          <PrimaryButton label="Sign in" loading={loading} disabled={!canSubmit && submitted} onPress={handleSignIn} />
        </GlassCard>

        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text
            style={{
              color: theme.color.role.primary,
              textAlign: 'center',
              fontSize: theme.type.sizes.base,
              fontFamily: theme.type.family.bodySemi,
            }}
          >
            No account yet? Create one
          </Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
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
    gap: 10,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  toggle: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
