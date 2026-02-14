import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PendingMatch, usePendingMatches } from '../../src/hooks/usePendingMatches';
import { useMatches } from '../../src/hooks/useMatches';
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
  const { profile, loading: profileLoading, error: profileError, refresh: refreshProfile } = useProfile();
  const { rating, loading: ratingLoading, refresh: refreshRating } = useRating();
  const { matches: pendingMatches, approveMatch, rejectMatch, refresh: refreshPendingMatches } = usePendingMatches();
  const { pendingReceived, pendingReceivedUsers, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const { matches: recentMatchesRaw, loading: recentMatchesLoading, refresh: refreshRecentMatches } = useMatches({ status: 'approved' });
  const {
    notifications,
    unreadCount,
    markAsRead,
    refresh: refreshNotifications,
  } = useNotifications();
  const [showFriendPrompt, setShowFriendPrompt] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const panelWidth = Math.min(360, screenWidth * 0.9);

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

  const pendingMatchById = useMemo(() => {
    return new Map(pendingMatches.map((match) => [match.id, match]));
  }, [pendingMatches]);

  const pendingFriendById = useMemo(() => {
    return new Map(pendingReceivedUsers.map((user) => [user.id, user]));
  }, [pendingReceivedUsers]);

  const recentMatches = useMemo(() => {
    return recentMatchesRaw.slice(0, 5);
  }, [recentMatchesRaw]);
  useEffect(() => {
    if (pendingReceivedUsers.length === 0) {
      setShowFriendPrompt(false);
      return;
    }

    setShowFriendPrompt(true);
    const timer = setTimeout(() => setShowFriendPrompt(false), 8000);
    return () => clearTimeout(timer);
  }, [pendingReceivedUsers.length]);

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

  const openNotifications = () => {
    setIsNotificationsOpen(true);
    refreshNotifications();
    refreshPendingMatches();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeNotifications = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsNotificationsOpen(false);
    });
  };

  const handleApproveMatchNotification = async (matchId: string, notificationId?: string) => {
    const success = await approveMatch(matchId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
      refreshPendingMatches();
      refreshNotifications();
      refreshProfile();
      refreshRating();
      refreshRecentMatches();
    }
  };

  const handleRejectMatchNotification = async (matchId: string, notificationId?: string) => {
    const success = await rejectMatch(matchId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
      refreshPendingMatches();
      refreshNotifications();
      refreshProfile();
      refreshRating();
      refreshRecentMatches();
    }
  };

  const handleAcceptFriendNotification = async (requesterId: string, notificationId?: string) => {
    const success = await acceptFriendRequest(requesterId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
    }
  };

  const handleRejectFriendNotification = async (requesterId: string, notificationId?: string) => {
    const success = await rejectFriendRequest(requesterId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
    }
  };

  const formatTeamNames = (match: PendingMatch, team: 'team_a' | 'team_b') => {
    const names = match.participants
      .filter((participant) => participant.team === team)
      .map((participant) => participant.full_name || 'Player');

    return names.length > 0 ? names.join(' & ') : 'TBD';
  };

  const formatMatchSummary = (match: PendingMatch) => {
    const teamA = formatTeamNames(match, 'team_a');
    const teamB = formatTeamNames(match, 'team_b');
    return {
      title: `${match.match_type === 'singles' ? 'Singles' : 'Doubles'} ${match.match_mode}`,
      teams: `${teamA} vs ${teamB}`,
      score: `${match.team_a_score} - ${match.team_b_score}`,
      winner: match.winner_team === 'team_a' ? teamA : teamB,
    };
  };

  const formatRecentMatch = (match: typeof recentMatchesRaw[number]) => {
    const teamA = [match.team1_player1, match.team1_player2]
      .filter(Boolean)
      .map((player) => player?.full_name || 'Player')
      .join(' & ');
    const teamB = [match.team2_player1, match.team2_player2]
      .filter(Boolean)
      .map((player) => player?.full_name || 'Player')
      .join(' & ');
    const userOnTeamA = [match.team1_player1?.id, match.team1_player2?.id]
      .filter(Boolean)
      .includes(profile?.id || '');
    const userTeam = userOnTeamA ? teamA : teamB;
    const opponentTeam = userOnTeamA ? teamB : teamA;
    const userWon = match.winning_team === (userOnTeamA ? 1 : 2);
    const score = userOnTeamA
      ? `${match.score_team1} - ${match.score_team2}`
      : `${match.score_team2} - ${match.score_team1}`;
    return {
      title: `${userTeam} vs ${opponentTeam}`,
      subtitle: `${match.is_ranked ? 'Ranked' : 'Casual'} • ${score}`,
      result: userWon ? 'Win' : 'Loss',
    };
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
          <View style={styles.headerActions}>
            <Pressable style={styles.bellButton} onPress={openNotifications}>
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.rankPill}>
              <Text style={styles.rankLabel}>Rating</Text>
              <Text style={styles.rankValue}>{rating?.rating ?? 1200}</Text>
            </View>
          </View>
        </View>

        {showFriendPrompt && (
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent matches</Text>
          {recentMatchesLoading ? (
            <View style={styles.matchCard}>
              <Text style={styles.matchSubtitle}>Loading recent matches...</Text>
            </View>
          ) : recentMatches.length === 0 ? (
            <View style={styles.matchCard}>
              <View>
                <Text style={styles.matchTitle}>No matches logged yet</Text>
                <Text style={styles.matchSubtitle}>Play your first match to see it here.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.matchList}>
              {recentMatches.map((match) => {
                const summary = formatRecentMatch(match);
                return (
                  <View key={match.id} style={styles.matchCard}>
                    <View>
                      <Text style={styles.matchTitle}>{summary.title}</Text>
                      <Text style={styles.matchSubtitle}>{summary.subtitle}</Text>
                    </View>
                    <View style={summary.result === 'Win' ? styles.matchBadgeWin : styles.matchBadgeLoss}>
                      <Text style={styles.matchBadgeText}>{summary.result}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      {isNotificationsOpen && (
        <Pressable style={styles.overlay} onPress={closeNotifications} />
      )}
      <Animated.View
        pointerEvents={isNotificationsOpen ? 'auto' : 'none'}
        style={[
          styles.notificationsPanel,
          {
            width: panelWidth,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelWidth, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Notifications</Text>
          <Pressable style={styles.panelClose} onPress={closeNotifications}>
            <Text style={styles.panelCloseText}>Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.panelList}>
          {notifications.length === 0 && (
            <View style={styles.panelEmpty}>
              <Text style={styles.panelEmptyText}>No notifications yet</Text>
            </View>
          )}
          {notifications
            .filter((notification) => !(notification.type === 'match_approval' && notification.read))
            .map((notification) => {
            const matchId = notification.data?.match_id as string | undefined;
            const requesterId = notification.data?.requester_id as string | undefined;
            const pendingMatch = matchId ? pendingMatchById.get(matchId) : undefined;
            const requester = requesterId ? pendingFriendById.get(requesterId) : undefined;
            const matchSummary = pendingMatch ? formatMatchSummary(pendingMatch) : null;
            const requesterName = requester?.full_name || 'Someone';

            return (
              <View key={notification.id} style={[
                styles.panelCard,
                !notification.read && styles.panelCardUnread,
              ]}>
                <View style={styles.panelCardHeader}>
                  <Text style={styles.panelCardTitle}>{notification.title}</Text>
                  <Text style={styles.panelCardTime}>{new Date(notification.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.panelCardMessage}>{notification.message}</Text>

                {notification.type === 'match_approval' && (
                  <View style={styles.panelDetails}>
                    {matchSummary ? (
                      <>
                        <Text style={styles.panelDetailText}>{matchSummary.title}</Text>
                        <Text style={styles.panelDetailText}>{matchSummary.teams}</Text>
                        <Text style={styles.panelDetailText}>Score: {matchSummary.score}</Text>
                        <Text style={styles.panelDetailText}>Winner: {matchSummary.winner}</Text>
                      </>
                    ) : (
                      <Text style={styles.panelDetailText}>Match details unavailable.</Text>
                    )}
                    <View style={styles.panelActions}>
                      <Pressable
                        style={[styles.panelButton, styles.panelButtonGhost]}
                        onPress={() => matchId && handleRejectMatchNotification(matchId, notification.id)}
                      >
                        <Text style={styles.panelButtonGhostText}>Decline</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.panelButton, styles.panelButtonPrimary]}
                        onPress={() => matchId && handleApproveMatchNotification(matchId, notification.id)}
                      >
                        <Text style={styles.panelButtonPrimaryText}>Approve</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {notification.type === 'friend_request' && (
                  <View style={styles.panelDetails}>
                    <Text style={styles.panelDetailText}>{requesterName} sent you a friend request.</Text>
                    <View style={styles.panelActions}>
                      <Pressable
                        style={[styles.panelButton, styles.panelButtonGhost]}
                        onPress={() => requesterId && handleRejectFriendNotification(requesterId, notification.id)}
                      >
                        <Text style={styles.panelButtonGhostText}>Decline</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.panelButton, styles.panelButtonPrimary]}
                        onPress={() => requesterId && handleAcceptFriendNotification(requesterId, notification.id)}
                      >
                        <Text style={styles.panelButtonPrimaryText}>Accept</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {notification.type === 'achievement' && notification.data?.details && (
                  <View style={styles.panelDetails}>
                    <Text style={styles.panelDetailText}>{notification.data.details}</Text>
                  </View>
                )}

                {!notification.read && (
                  <Pressable
                    style={styles.panelMarkRead}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <Text style={styles.panelMarkReadText}>Mark as read</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellIcon: {
    fontSize: 18,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.coral,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: typography.weights.bold,
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
  matchBadgeWin: {
    backgroundColor: '#e7f6ef',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeLoss: {
    backgroundColor: '#ffecec',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 10, 20, 0.45)',
  },
  notificationsPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingTop: spacing.lg,
  },
  panelHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  panelClose: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelCloseText: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  panelList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  panelEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  panelEmptyText: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
  },
  panelCard: {
    backgroundColor: '#f7f8fb',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  panelCardUnread: {
    borderColor: colors.blue,
    backgroundColor: '#eef4ff',
  },
  panelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    flex: 1,
  },
  panelCardTime: {
    fontSize: typography.sizes.xs,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
  panelCardMessage: {
    fontSize: typography.sizes.sm,
    color: colors.ink,
    lineHeight: 18,
  },
  panelDetails: {
    marginTop: spacing.xs,
    gap: 4,
  },
  panelDetailText: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  panelActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  panelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  panelButtonGhost: {
    borderWidth: 1,
    borderColor: '#d9e1f2',
    backgroundColor: '#ffffff',
  },
  panelButtonGhostText: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  panelButtonPrimary: {
    backgroundColor: colors.blue,
  },
  panelButtonPrimaryText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  panelMarkRead: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  panelMarkReadText: {
    color: colors.blue,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
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
