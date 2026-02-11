import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      Alert.alert('Error', 'Supabase is not configured.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: handleSignOut },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your account and preferences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Profile</Text>
              <Text style={styles.cardValue}>Coming soon</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Notifications</Text>
              <Text style={styles.cardValue}>Coming soon</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Privacy</Text>
              <Text style={styles.cardValue}>Public</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.signOutButton, loading && styles.signOutDisabled]}
          onPress={confirmSignOut}
          disabled={loading}
        >
          <Text style={styles.signOutText}>
            {loading ? 'Signing out...' : 'Sign out'}
          </Text>
        </Pressable>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.muted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: typography.sizes.base,
    color: colors.ink,
  },
  cardValue: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  signOutButton: {
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signOutDisabled: {
    backgroundColor: '#f0b2a9',
  },
  signOutText: {
    color: '#ffffff',
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xl,
  },
});
