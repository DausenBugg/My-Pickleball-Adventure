import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useProfile, useRating } from '../../src/hooks/useProfile';
import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { registerForPushNotificationsAsync, savePushToken } from '../../src/lib/notifications';
import { useAuth } from '../../src/state/auth';
import { AppScreen, Avatar, GlassCard, GradientHeader, PrimaryButton, SegmentedControl } from '../../src/components/ui';
import { ThemeMode, useAppTheme } from '../../src/theme';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useAppTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { profile, loading: profileLoading, uploadAvatar } = useProfile();
  const { rating } = useRating();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  useEffect(() => {
    const loadNotificationPreference = async () => {
      const stored = await AsyncStorage.getItem('notifications_enabled');
      if (stored === 'false') setNotificationsEnabled(false);
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
        const { error: deleteError } = await supabase.from('push_tokens').delete().eq('user_id', session.user.id);
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

    if (error) Alert.alert('Error', error.message);
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: handleSignOut },
    ]);
  };

  const handleAvatarUpload = async () => {
    if (!uploadAvatar) return;
    setUploadingAvatar(true);
    const result = await uploadAvatar();
    setUploadingAvatar(false);
    if (result.error && result.error !== 'Cancelled') {
      Alert.alert('Upload error', result.error);
    }
  };

  return (
    <AppScreen contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 120 }}>
      <GradientHeader title="Settings" subtitle="Control your profile, preferences, and experience." />

      {profileLoading ? (
        <GlassCard style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <ActivityIndicator size="large" color={theme.color.role.primary} />
        </GlassCard>
      ) : profile ? (
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Pressable onPress={handleAvatarUpload} disabled={uploadingAvatar}>
              <Avatar uri={profile.avatar_url} name={profile.full_name || 'Player'} size={66} />
              {uploadingAvatar ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 33,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.35)',
                  }}
                >
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.md }}>
                {profile.full_name || 'Player'}
              </Text>
              <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, marginTop: 4 }}>
                {profile.email}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
            {[
              { label: 'Level', value: profile.level },
              { label: 'Rating', value: rating?.rating ?? 1200 },
              { label: 'Wins', value: profile.wins },
            ].map((item) => (
              <View key={item.label} style={{ alignItems: 'center' }}>
                <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.lg }}>
                  {item.value}
                </Text>
                <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.sm }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ) : null}

      <GlassCard style={{ gap: theme.spacing.sm }}>
        <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }}>Theme Mode</Text>
        <SegmentedControl<ThemeMode>
          value={mode}
          onChange={(value) => setMode(value)}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </GlassCard>

      <GlassCard style={{ gap: theme.spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/achievements')}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="trophy-outline" size={18} color={theme.color.role.primary} />
            <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>Achievements</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.color.role.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/match-history')}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="stats-chart-outline" size={18} color={theme.color.role.primary} />
            <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>Match history</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.color.role.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleAvatarUpload}
          disabled={uploadingAvatar}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="camera-outline" size={18} color={theme.color.role.primary} />
            <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>Change profile photo</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.color.role.textMuted} />
        </Pressable>
      </GlassCard>

      <GlassCard style={{ gap: theme.spacing.sm }}>
        <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>Notifications</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>
              {notificationsSaving ? 'Saving...' : notificationsEnabled ? 'On' : 'Off'}
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#D4DCE4', true: theme.color.role.primarySoft }}
              thumbColor={notificationsEnabled ? theme.color.role.primary : '#F8FAFC'}
            />
          </View>
        </View>
      </GlassCard>

      <PrimaryButton label={loading ? 'Signing out...' : 'Sign out'} onPress={confirmSignOut} loading={loading} />

      <Text
        style={{
          textAlign: 'center',
          color: theme.color.role.textMuted,
          fontFamily: theme.type.family.body,
          fontSize: theme.type.sizes.xs,
        }}
      >
        Version 1.0.0
      </Text>
    </AppScreen>
  );
}
