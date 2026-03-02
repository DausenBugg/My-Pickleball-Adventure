import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { recordTelemetry } from '../../src/lib/telemetry';
import { useAuth } from '../../src/state/auth';
import { watchColors } from '../../src/theme/colors';
import { watchSizing } from '../../src/theme/sizing';

export default function LoginScreen() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => email.includes('@') && password.length >= 8, [email, password]);

  if (!loading && session) {
    return <Redirect href="/(tabs)/log-match" />;
  }

  const handleSignIn = async () => {
    if (!canSubmit) {
      setError('Enter a valid email and password.');
      recordTelemetry('auth_login_validation_failed', {
        hasEmail: Boolean(email),
        passwordLength: password.length,
      });
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured.');
      recordTelemetry('auth_login_missing_supabase_config');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        recordTelemetry('auth_login_failed', {
          message: signInError.message,
        });
      }
    } catch (err: any) {
      setError('Unable to sign in right now.');
      recordTelemetry('auth_login_exception', {
        message: err?.message ?? 'unknown',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentWrap}>
          <Text style={styles.title}>MPA</Text>
          <Text style={styles.subtitle}>Sign in to log matches quickly.</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={watchColors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={watchColors.muted}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={[styles.button, !canSubmit || submitting ? styles.buttonDisabled : null]}
            onPress={handleSignIn}
            disabled={!canSubmit || submitting}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: watchColors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: watchSizing.pageHorizontal,
    paddingVertical: watchSizing.pageGap,
  },
  contentWrap: {
    gap: watchSizing.pageGap,
  },
  title: {
    color: watchColors.text,
    fontSize: watchSizing.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: watchColors.muted,
    fontSize: watchSizing.subtitle,
    textAlign: 'center',
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: watchColors.border,
    backgroundColor: watchColors.surface,
    color: watchColors.text,
    borderRadius: watchSizing.controlRadius,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: watchSizing.body,
    minHeight: watchSizing.controlHeight,
  },
  button: {
    backgroundColor: watchColors.primary,
    borderRadius: watchSizing.cardRadius,
    alignItems: 'center',
    marginTop: 2,
    minHeight: watchSizing.buttonHeight,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: watchColors.textOnPrimary,
    fontWeight: '700',
    fontSize: watchSizing.bodyStrong,
  },
  error: {
    color: watchColors.secondary,
    fontSize: watchSizing.subtitle,
    textAlign: 'center',
  },
});