import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useProfile, useRating } from '../../src/hooks/useProfile';
import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { registerForPushNotificationsAsync, savePushToken } from '../../src/lib/notifications';
import { useTheme, type ThemeMode } from '../../src/theme/ThemeContext';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';
import { useAuth } from '../../src/state/auth';
import AnimatedPressable from '../../src/components/AnimatedPressable';
import AdBanner from '../../src/components/AdBanner';
import { AD_UNIT_IDS } from '../../src/lib/adUnitIds';

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const { profile, loading: profileLoading, uploadAvatar } = useProfile();
  const { rating } = useRating();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  useEffect(() => {
    const loadNotificationPreference = async () => {
      const stored = await AsyncStorage.getItem('notifications_enabled');
      if (stored === 'false') {
        setNotificationsEnabled(false);
      }
    };

    loadNotificationPreference();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    setNotificationsSaving(true);

    try {
      await AsyncStorage.setItem('notifications_enabled', value ? 'true' : 'false');

      if (!session?.user?.id || !supabase) return;

      if (value) {
        const token = await registerForPushNotificationsAsync();
        if (token && typeof token === 'string') {
          await savePushToken(session.user.id, token);
        }
      } else {
        const { error: deleteError } = await supabase
          .from('push_tokens')
          .delete()
          .eq('user_id', session.user.id);

        if (deleteError) {
          console.warn('Failed to remove push tokens:', deleteError);
        }
      }
    } catch (err) {
      console.error('Failed to update notification preference:', err);
    } finally {
      setNotificationsSaving(false);
    }
  };

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

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['system', 'light', 'dark'];
    const currentIdx = modes.indexOf(mode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setMode(nextMode);
  };

  const themeLabel = mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light';
  const themeIcon = mode === 'dark' ? 'moon' : mode === 'light' ? 'sunny' : 'phone-portrait-outline';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Manage your account and preferences.
          </Text>
        </Animated.View>

        {profileLoading ? (
          <View style={styles.profileLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : profile ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            {/* Profile hero card with primary bg */}
            <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
              <View style={styles.profileHeader}>
                <Pressable onPress={handleAvatarUpload} disabled={uploadingAvatar}>
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
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
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>
                    {rating?.rating ?? 1200}
                  </Text>
                  <Text style={styles.profileStatLabel}>Rating</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>{profile.wins}</Text>
                  <Text style={styles.profileStatLabel}>Wins</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Ad banner */}
        <AdBanner adUnitId={AD_UNIT_IDS.SETTINGS_BANNER} />

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <AnimatedPressable 
              style={styles.cardRow} 
              onPress={() => router.push('/achievements')}
            >
              <View style={styles.cardRowLeft}>
                <Ionicons name="trophy" size={20} color={colors.primary} />
                <Text style={[styles.cardLabel, { color: colors.ink }]}>Achievements</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </AnimatedPressable>
            <View style={[styles.cardDivider, { backgroundColor: colors.borderLight }]} />
            <AnimatedPressable 
              style={styles.cardRow} 
              onPress={() => router.push('/match-history')}
            >
              <View style={styles.cardRowLeft}>
                <Ionicons name="stats-chart" size={20} color={colors.primary} />
                <Text style={[styles.cardLabel, { color: colors.ink }]}>Match History</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </AnimatedPressable>
            <View style={[styles.cardDivider, { backgroundColor: colors.borderLight }]} />
            <AnimatedPressable 
              style={styles.cardRow} 
              onPress={handleAvatarUpload}
              disabled={uploadingAvatar}
            >
              <View style={styles.cardRowLeft}>
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={[styles.cardLabel, { color: colors.ink }]}>Change Profile Photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </AnimatedPressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
                <Text style={[styles.cardLabel, { color: colors.ink }]}>Notifications</Text>
              </View>
              <View style={styles.notificationsToggle}>
                <Text style={[styles.cardValue, { color: colors.muted }]}>
                  {notificationsSaving ? 'Saving...' : notificationsEnabled ? 'On' : 'Off'}
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={notificationsEnabled ? colors.primary : colors.muted}
                />
              </View>
            </View>
            <View style={[styles.cardDivider, { backgroundColor: colors.borderLight }]} />
            <AnimatedPressable style={styles.cardRow} onPress={cycleTheme}>
              <View style={styles.cardRowLeft}>
                <Ionicons name={themeIcon as any} size={20} color={colors.primary} />
                <Text style={[styles.cardLabel, { color: colors.ink }]}>Appearance</Text>
              </View>
              <View style={styles.notificationsToggle}>
                <Text style={[styles.cardValue, { color: colors.muted }]}>{themeLabel}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </View>
            </AnimatedPressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <AnimatedPressable
            style={[styles.signOutButton, { backgroundColor: colors.secondary }, loading ? styles.signOutDisabled : {}]}
            onPress={confirmSignOut}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.textOnSecondary} />
            <Text style={[styles.signOutText, { color: colors.textOnSecondary }]}>
              {loading ? 'Signing out...' : 'Sign out'}
            </Text>
          </AnimatedPressable>

          <Text style={[styles.version, { color: colors.muted }]}>Version 1.0.0</Text>
        </Animated.View>

        {/* Spacer for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 32,
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileStatValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    marginBottom: 2,
  },
  profileStatLabel: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.base,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardDivider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  notificationsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardLabel: {
    fontSize: typography.sizes.base,
  },
  cardValue: {
    fontSize: typography.sizes.sm,
  },
  signOutButton: {
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  signOutDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    marginTop: spacing.xl,
  },
});
