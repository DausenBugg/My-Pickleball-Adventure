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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nameValid = useMemo(() => name.trim().length >= 2, [name]);
  const emailValid = useMemo(() => email.includes('@') && email.includes('.'), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const confirmValid = useMemo(() => confirmPassword === password && password.length > 0, [confirmPassword, password]);
  const canSubmit = nameValid && emailValid && passwordValid && confirmValid;

  const helperText = submitted && !canSubmit
    ? 'Fill all fields. Passwords must match and be 8+ characters.'
    : 'Create a password with at least 8 characters.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Start logging matches and climbing the ranks.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Jordan Lee"
              style={styles.input}
              value={name}
              onChangeText={setName}
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

          <Text style={[styles.helper, submitted && !canSubmit && styles.helperError]}>
            {helperText}
          </Text>

          <Pressable
            style={[styles.primary, !canSubmit && styles.primaryDisabled]}
            onPress={() => setSubmitted(true)}
          >
            <Text style={styles.primaryText}>Create account</Text>
          </Pressable>
          <Text style={styles.termsText}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
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
    backgroundColor: colors.coral,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryDisabled: {
    backgroundColor: '#f0b2a9',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  termsText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  link: {
    color: colors.blue,
    textAlign: 'center',
  },
});
