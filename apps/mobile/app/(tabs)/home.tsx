import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { usePendingMatches } from '../../src/hooks/usePendingMatches';
import { useNotifications } from '../../src/hooks/useNotifications';
import { useFriends } from '../../src/hooks/useFriends';
import {
  calculateLevelProgress,
  calculateXPForLevel,
  calculateXPToNextLevel,
  useProfile,
  useRating,
} from '../../src/hooks/useProfile';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const { rating, loading: ratingLoading } = useRating();
  const { matches: pendingMatches, approveMatch, rejectMatch } = usePendingMatches();
  const { pendingReceived, pendingReceivedUsers, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showFriendPrompt, setShowFriendPrompt] = useState(false);
  const [showMatchPrompt, setShowMatchPrompt] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const loading = profileLoading || ratingLoading;

  const xpToNext = useMemo(() => {
    if (!profile) return 0;
    return calculateXPToNextLevel(profile.level, profile.total_xp);
  }, [profile]);

  const levelProgress = useMemo(() => {
    if (!profile) return 0;
    return calculateLevelProgress(profile.level, profile.total_xp);
  }, [profile]);

  const xpForCurrentLevel = useMemo(() => {
    if (!profile) return 0;
    return calculateXPForLevel(profile.level);
  }, [profile]);

  const xpForNextLevel = useMemo(() => {
    if (!profile) return 0;
    return calculateXPForLevel(profile.level + 1);
  }, [profile]);

  const xpInCurrentLevel = useMemo(() => {
    if (!profile) return 0;
    return Math.max(0, profile.total_xp - xpForCurrentLevel);
  }, [profile, xpForCurrentLevel]);

  const xpNeededForLevel = useMemo(() => {
    if (!profile) return 0;
    return Math.max(1, xpForNextLevel - xpForCurrentLevel);
  }, [xpForCurrentLevel, xpForNextLevel]);

  // Estimate wins needed (assuming 120 XP per win)
  const winsToNext = useMemo(() => Math.ceil(xpToNext / 120), [xpToNext]);
  const matchApprovalNotifications = useMemo(
    () => notifications.filter((item) => item.type === 'match_approval' && !item.read),
    [notifications]
  );

  useEffect(() => {
    if (pendingReceivedUsers.length === 0) {
      setShowFriendPrompt(false);
      return;
    }

    setShowFriendPrompt(true);
    const timer = setTimeout(() => setShowFriendPrompt(false), 8000);
    return () => clearTimeout(timer);
  }, [pendingReceivedUsers.length]);

  useEffect(() => {
    if (pendingMatches.length === 0 && matchApprovalNotifications.length === 0) {
      setShowMatchPrompt(false);
      return;
    }

    setShowMatchPrompt(true);
    const timer = setTimeout(() => setShowMatchPrompt(false), 8000);
    return () => clearTimeout(timer);
  }, [pendingMatches.length, matchApprovalNotifications.length]);

  const handleAcceptFriend = async () => {
    const requestId = pendingReceivedUsers[0]?.id || pendingReceived[0];
    if (!requestId) return;
    const success = await acceptFriendRequest(requestId);
    if (success) setShowFriendPrompt(false);
  };

  const handleRejectFriend = async () => {
    const requestId = pendingReceivedUsers[0]?.id || pendingReceived[0];
    if (!requestId) return;
    const success = await rejectFriendRequest(requestId);
    if (success) setShowFriendPrompt(false);
  };

  const handleApproveMatch = async () => {
    const match = pendingMatches[0];
    const fallbackId = matchApprovalNotifications[0]?.data?.match_id as string | undefined;
    const matchId = match?.id || fallbackId;
    if (!matchId) return;
    const success = await approveMatch(matchId);
    if (success) {
      if (matchApprovalNotifications[0]) {
        await markAsRead(matchApprovalNotifications[0].id);
      }
      setShowMatchPrompt(false);
    }
  };

  const handleRejectMatch = async () => {
    const match = pendingMatches[0];
    const fallbackId = matchApprovalNotifications[0]?.data?.match_id as string | undefined;
    const matchId = match?.id || fallbackId;
    if (!matchId) return;
    const success = await rejectMatch(matchId);
    if (success) {
      if (matchApprovalNotifications[0]) {
        await markAsRead(matchApprovalNotifications[0].id);
      }
      setShowMatchPrompt(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile data</Text>
          <Text style={styles.errorHint}>
            Make sure you've run the database migrations
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No profile found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} colors={[colors.blue]} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your KPIs</Text>
            <Text style={styles.subtitle}>
              {profile.full_name || 'Player'}'s overview
            </Text>
          </View>
          <View style={styles.rankPill}>
            <Text style={styles.rankLabel}>Rating</Text>
            <Text style={styles.rankValue}>{rating?.rating ?? 1200}</Text>
          </View>
        </View>

        {(showFriendPrompt || showMatchPrompt) && (
          <View style={styles.prompts}>
            {showFriendPrompt && pendingReceivedUsers.length > 0 && (
              <View style={styles.promptCard}>
                <View style={styles.promptHeader}>
                  <Text style={styles.promptTitle}>New friend request</Text>
                  <Text style={styles.promptMeta}>Tap to respond</Text>
                </View>
                <Text style={styles.promptBody}>
                  {pendingReceivedUsers.length === 1
                    ? `${pendingReceivedUsers[0]?.full_name || 'Someone'} sent you a friend request.`
                    : `${pendingReceivedUsers[0]?.full_name || 'Someone'} and ${pendingReceivedUsers.length - 1} others sent requests.`}
                </Text>
                <View style={styles.promptActions}>
                  <Pressable style={[styles.promptButton, styles.promptDecline]} onPress={handleRejectFriend}>
                    <Text style={styles.promptDeclineText}>Decline</Text>
                  </Pressable>
                  <Pressable style={[styles.promptButton, styles.promptAccept]} onPress={handleAcceptFriend}>
                    <Text style={styles.promptAcceptText}>Accept</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {showMatchPrompt && (pendingMatches.length > 0 || matchApprovalNotifications.length > 0) && (
              <View style={styles.promptCard}>
                <View style={styles.promptHeader}>
                  <Text style={styles.promptTitle}>Match awaiting approval</Text>
                  <Text style={styles.promptMeta}>You were tagged in a match</Text>
                </View>
                <Text style={styles.promptBody}>
                  {pendingMatches.length > 0
                    ? `${pendingMatches.length} pending match${pendingMatches.length === 1 ? '' : 'es'} waiting for your vote.`
                    : `${matchApprovalNotifications.length} match request${matchApprovalNotifications.length === 1 ? '' : 's'} waiting for your vote.`}
                </Text>
                <View style={styles.promptActions}>
                  <Pressable style={[styles.promptButton, styles.promptDecline]} onPress={handleRejectMatch}>
                    <Text style={styles.promptDeclineText}>Reject</Text>
                  </Pressable>
                  <Pressable style={[styles.promptButton, styles.promptAccept]} onPress={handleApproveMatch}>
                    <Text style={styles.promptAcceptText}>Approve</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Wins</Text>
            <Text style={styles.cardValue}>{profile.wins}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Losses</Text>
            <Text style={styles.cardValue}>{profile.losses}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Level</Text>
            <Text style={styles.cardValue}>{profile.level}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>XP to next</Text>
            <Text style={styles.cardValue}>{xpToNext}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Level {profile.level} progress</Text>
            <Text style={styles.progressMeta}>
              {xpInCurrentLevel} / {xpNeededForLevel} XP
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {winsToNext} {winsToNext === 1 ? 'win' : 'wins'} away from Level{' '}
            {profile.level + 1}
          </Text>
        </View>

        {pendingMatches.length > 0 && (
          <Pressable
            style={styles.approvalsButton}
            onPress={() => router.push('/approvals')}
          >
            <View style={styles.approvalsBadge}>
              <Text style={styles.approvalsBadgeText}>{pendingMatches.length}</Text>
            </View>
            <View style={styles.approvalsContent}>
              <Text style={styles.approvalsTitle}>Pending Approvals</Text>
              <Text style={styles.approvalsSubtitle}>
                {pendingMatches.length} {pendingMatches.length === 1 ? 'match' : 'matches'}{' '}
                waiting for your approval
              </Text>
            </View>
            <Text style={styles.approvalsChevron}>›</Text>
          </Pressable>
        )}

        {(unreadCount > 0 || pendingReceivedUsers.length > 0 || pendingMatches.length > 0 || matchApprovalNotifications.length > 0) && (
          <Pressable
            style={styles.notificationsButton}
            onPress={() => setShowAlerts((prev) => !prev)}
          >
            <View style={styles.notificationsBadge}>
              <Text style={styles.notificationsBadgeText}>
                {unreadCount + pendingReceivedUsers.length + pendingMatches.length + matchApprovalNotifications.length}
              </Text>
            </View>
            <View style={styles.notificationsContent}>
              <Text style={styles.notificationsTitle}>Recent Alerts</Text>
              <Text style={styles.notificationsSubtitle}>
                Tap to view achievements, requests, and approvals
              </Text>
            </View>
            <Text style={styles.notificationsChevron}>›</Text>
          </Pressable>
        )}

        {showAlerts && (
          <View style={styles.alertsPanel}>
            {unreadCount > 0 && (
              <Pressable
                style={styles.alertRow}
                onPress={() => router.push('/notifications')}
              >
                <Text style={styles.alertTitle}>Achievements and updates</Text>
                <Text style={styles.alertMeta}>{unreadCount} unread</Text>
              </Pressable>
            )}

            {pendingReceivedUsers.length > 0 && (
              <View style={styles.alertRow}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>Friend requests</Text>
                  <Text style={styles.alertMeta}>{pendingReceivedUsers.length} waiting</Text>
                </View>
                <View style={styles.alertActions}>
                  <Pressable style={styles.alertButtonGhost} onPress={handleRejectFriend}>
                    <Text style={styles.alertButtonGhostText}>Decline</Text>
                  </Pressable>
                  <Pressable style={styles.alertButton} onPress={handleAcceptFriend}>
                    <Text style={styles.alertButtonText}>Accept</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {(pendingMatches.length > 0 || matchApprovalNotifications.length > 0) && (
              <View style={styles.alertRow}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>Pending matches</Text>
                  <Text style={styles.alertMeta}>
                    {pendingMatches.length > 0
                      ? `${pendingMatches.length} waiting`
                      : `${matchApprovalNotifications.length} waiting`}
                  </Text>
                </View>
                <View style={styles.alertActions}>
                  <Pressable style={styles.alertButtonGhost} onPress={handleRejectMatch}>
                    <Text style={styles.alertButtonGhostText}>Reject</Text>
                  </Pressable>
                  <Pressable style={styles.alertButton} onPress={handleApproveMatch}>
                    <Text style={styles.alertButtonText}>Approve</Text>
                  </Pressable>
                </View>
                <Pressable style={styles.alertLink} onPress={() => router.push('/approvals')}>
                  <Text style={styles.alertLinkText}>Review all</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.coral,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.muted,
    marginTop: 4,
  },
  rankPill: {
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  rankLabel: {
    color: '#d7e7ff',
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rankValue: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
    marginTop: 2,
  },
  prompts: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  promptHeader: {
    gap: 2,
  },
  promptTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  promptMeta: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  promptBody: {
    fontSize: typography.sizes.sm,
    color: colors.ink,
  },
  promptActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promptButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  promptDecline: {
    backgroundColor: '#fff4f2',
    borderWidth: 1,
    borderColor: '#ffd6d1',
  },
  promptAccept: {
    backgroundColor: colors.blue,
  },
  promptDeclineText: {
    color: colors.coral,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  promptAcceptText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.ink,
    marginTop: 8,
  },
  progressCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  progressMeta: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e7ecf4',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
  },
  progressHint: {
    marginTop: 10,
    color: colors.muted,
    fontSize: typography.sizes.sm,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  matchList: {
    gap: spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.blue,
  },
  viewAllChevron: {
    fontSize: typography.sizes.md,
    color: colors.blue,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  matchSubtitle: {
    color: colors.muted,
    marginTop: 6,
  },
  matchBadge: {
    backgroundColor: '#eaf1ff',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  approvalsButton: {
    backgroundColor: '#fff4e6',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  approvalsBadge: {
    backgroundColor: colors.coral,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalsBadgeText: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  approvalsContent: {
    flex: 1,
  },
  approvalsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: 2,
  },
  approvalsSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  approvalsChevron: {
    fontSize: 32,
    color: colors.muted,
  },
  notificationsButton: {
    backgroundColor: '#e6f4ff',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#b3d9ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  notificationsBadge: {
    backgroundColor: colors.blue,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsBadgeText: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  notificationsContent: {
    flex: 1,
  },
  notificationsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: 2,
  },
  notificationsSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  notificationsChevron: {
    fontSize: 32,
    color: colors.muted,
  },
  alertsPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  alertRow: {
    backgroundColor: '#f9f9f9',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertInfo: {
    gap: 2,
  },
  alertTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  alertMeta: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alertButton: {
    flex: 1,
    backgroundColor: colors.blue,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  alertButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  alertButtonGhost: {
    flex: 1,
    backgroundColor: '#fff4f2',
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#ffd6d1',
  },
  alertButtonGhostText: {
    color: colors.coral,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  alertLink: {
    alignSelf: 'flex-start',
  },
  alertLinkText: {
    color: colors.blue,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
