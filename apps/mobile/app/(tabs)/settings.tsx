import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useProfile, useRating } from '../../src/hooks/useProfile';
import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, loading: profileLoading, uploadAvatar } = useProfile();
  const { rating } = useRating();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  const handleAvatarUpload = async () => {
    if (!uploadAvatar) return;
    
    setUploadingAvatar(true);
    const result = await uploadAvatar();
    setUploadingAvatar(false);

    if (result.error && result.error !== 'Cancelled') {
      Alert.alert('Upload Error', result.error);
    }
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

        {profileLoading ? (
          <View style={styles.profileLoading}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        ) : profile ? (
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Pressable onPress={handleAvatarUpload} disabled={uploadingAvatar}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(profile.full_name || 'P')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                {uploadingAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                )}
              </Pressable>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile.full_name || 'Player'}
                </Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
              </View>
            </View>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{profile.level}</Text>
                <Text style={styles.profileStatLabel}>Level</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>
                  {rating?.rating ?? 1200}
                </Text>
                <Text style={styles.profileStatLabel}>Rating</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{profile.wins}</Text>
                <Text style={styles.profileStatLabel}>Wins</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Pressable 
              style={styles.cardRow} 
              onPress={() => router.push('/achievements')}
            >
              <Text style={styles.cardLabel}>🏆 Achievements</Text>
              <Text style={styles.cardChevron}>›</Text>
            </Pressable>
            <Pressable 
              style={styles.cardRow} 
              onPress={() => router.push('/match-history')}
            >
              <Text style={styles.cardLabel}>📊 Match History</Text>
              <Text style={styles.cardChevron}>›</Text>
            </Pressable>
            <Pressable 
              style={styles.cardRow} 
              onPress={handleAvatarUpload}
              disabled={uploadingAvatar}
            >
              <Text style={styles.cardLabel}>📸 Change Profile Photo</Text>
              <Text style={styles.cardChevron}>›</Text>
            </Pressable>
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
  profileLoading: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
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
  cardChevron: {
    fontSize: typography.sizes.xl,
    color: colors.blue,
    fontWeight: typography.weights.normal,
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
