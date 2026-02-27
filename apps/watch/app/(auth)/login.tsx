import { Redirect } from 'expo-router';
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
import { recordTelemetry } from '../../src/lib/telemetry';
import { useAuth } from '../../src/state/auth';

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
      <View style={styles.container}>
        <Text style={styles.title}>Pickleball Watch</Text>
        <Text style={styles.subtitle}>Sign in to log matches quickly.</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8FA1C0"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#8FA1C0"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#AFC2E4',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#25324A',
    backgroundColor: '#141E32',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3E6AE1',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    color: '#FF9AA2',
    fontSize: 12,
    textAlign: 'center',
  },
});