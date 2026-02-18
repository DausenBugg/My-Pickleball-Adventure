import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/theme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import AnimatedPressable from '../../src/components/AnimatedPressable';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get current user email
    supabase?.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email);
      }
    });
  }, []);

  const handleResendEmail = async () => {
    if (!supabase || !email) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Verification email sent! Check your inbox.');
      }
    } catch (err) {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Refresh session to get updated email_confirmed_at
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setMessage('Failed to check verification status.');
      } else if (session?.user?.email_confirmed_at) {
        // Email is now verified, redirect to home
        router.replace('/(tabs)/home');
      } else {
        setMessage('Email not verified yet. Please check your inbox.');
      }
    } catch (err) {
      setMessage('Failed to check verification status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="mail-outline" size={48} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.ink }]}>
            Verify your email
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            We've sent a verification link to:
          </Text>
          
          <Text style={[styles.email, { color: colors.ink }]}>
            {email || 'your email address'}
          </Text>
          
          <Text style={[styles.description, { color: colors.muted }]}>
            Please click the link in the email to verify your account. 
            You need to verify your email before you can log matches.
          </Text>

          {message ? (
            <Text style={[styles.message, { color: message.includes('sent') ? colors.success : colors.error }]}>
              {message}
            </Text>
          ) : null}

          <AnimatedPressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleCheckVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>I've verified my email</Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.secondaryButton, { borderColor: colors.borderLight }]}
            onPress={handleResendEmail}
            disabled={loading}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Resend verification email
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={styles.linkButton}
            onPress={handleSignOut}
          >
            <Text style={[styles.linkText, { color: colors.muted }]}>
              Sign out and use a different account
            </Text>
          </AnimatedPressable>
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
    padding: spacing.lg,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  message: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  linkButton: {
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    textDecorationLine: 'underline',
  },
});
