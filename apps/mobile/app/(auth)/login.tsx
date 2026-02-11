import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  ink: '#0b1a2b',
  muted: '#5a6a7d',
  blue: '#2b6cb0',
  coral: '#ff6b5a',
  surface: '#ffffff',
  background: '#f7f8fb',
  border: '#d6dbe3',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailValid = useMemo(() => email.includes('@') && email.includes('.'), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const canSubmit = emailValid && passwordValid;

  const helperText = submitted && !canSubmit
    ? 'Enter a valid email and at least 8 characters.'
    : 'Use the email you registered with.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account.</Text>
        </View>

        <View style={styles.form}>
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
            onPress={() => setSubmitted(true)}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>

          <Link href="/(auth)/login" style={styles.resetLink}>
            Forgot password?
          </Link>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    color: colors.ink,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#eef2f7',
  },
  passwordToggleText: {
    color: colors.ink,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  helper: {
    color: colors.muted,
    fontSize: 12,
  },
  helperError: {
    color: colors.coral,
  },
  primary: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryDisabled: {
    backgroundColor: '#9cb7d6',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  resetLink: {
    color: colors.blue,
    textAlign: 'center',
  },
  link: {
    color: colors.blue,
    textAlign: 'center',
  },
});
