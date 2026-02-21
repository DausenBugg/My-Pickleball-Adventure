import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AdBanner from '../../src/components/AdBanner';
import { AD_UNIT_IDS } from '../../src/lib/adUnitIds';
import { Ionicons } from '@expo/vector-icons';
import ReAnimated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

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
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';
import CircularProgress from '../../src/components/CircularProgress';
import AnimatedPressable from '../../src/components/AnimatedPressable';
import ConfettiBurst from '../../src/components/ConfettiBurst';
import { LeagueLabel } from '../../src/components/LeagueBadge';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, loading: profileLoading, error: profileError, refresh: refreshProfile } = useProfile();
  const { rating, loading: ratingLoading, refresh: refreshRating } = useRating();
  const {
    matches: pendingMatches,
    approveMatch,
    rejectMatch,
    error: pendingMatchesError,
    refresh: refreshPendingMatches,
  } = usePendingMatches();
  const { pendingReceived, pendingReceivedUsers, acceptFriendRequest, rejectFriendRequest, refresh: refreshFriends } = useFriends();
  const { matches: recentMatchesRaw, loading: recentMatchesLoading, refresh: refreshRecentMatches } = useMatches({ status: 'approved' });
  const {
    notifications,
    unreadCount,
    markAsRead,
    refresh: refreshNotifications,
  } = useNotifications();
  const [showFriendPrompt, setShowFriendPrompt] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const prevLevelRef = useRef<number | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const panelWidth = Math.min(360, screenWidth * 0.9);

  const loading = profileLoading || ratingLoading;

  // Refresh profile when tab gains focus (e.g. after avatar change in settings)
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      refreshRating();
    }, [])
  );

  const xpToNext = useMemo(() => {
    if (!profile) return 0;
    return calculateXPToNextLevel(profile.level, profile.total_xp);
  }, [profile]);

  const levelProgress = useMemo(() => {
    if (!profile) return 0;
    return calculateLevelProgress(profile.level, profile.total_xp);
  }, [profile]);

  useEffect(() => {
    if (!pendingMatchesError) return;
    Alert.alert('Match request', pendingMatchesError);
  }, [pendingMatchesError]);

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

  const winsToNext = useMemo(() => Math.ceil(xpToNext / 120), [xpToNext]);

  // Detect level-up and trigger confetti
  useEffect(() => {
    if (!profile) return;
    if (prevLevelRef.current !== null && profile.level > prevLevelRef.current) {
      setShowConfetti(true);
    }
    prevLevelRef.current = profile.level;
  }, [profile?.level]);

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
      if (notificationId) {
        setDismissedNotifications((prev) => new Set(prev).add(notificationId));
      }
      if (notificationId) await markAsRead(notificationId);
      closeNotifications();
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
      if (notificationId) {
        setDismissedNotifications((prev) => new Set(prev).add(notificationId));
      }
      if (notificationId) await markAsRead(notificationId);
      closeNotifications();
      refreshPendingMatches();
      refreshNotifications();
      refreshProfile();
      refreshRating();
      refreshRecentMatches();
    }
  };

  const handleAcceptFriendNotification = async (requesterId: string, notificationId?: string) => {
    if (notificationId) {
      setDismissedNotifications((prev) => new Set(prev).add(notificationId));
    }
    const success = await acceptFriendRequest(requesterId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
      refreshNotifications();
      refreshFriends(); // Refresh friends list so search screen shows updated status
    }
  };

  const handleRejectFriendNotification = async (requesterId: string, notificationId?: string) => {
    if (notificationId) {
      setDismissedNotifications((prev) => new Set(prev).add(notificationId));
    }
    const success = await rejectFriendRequest(requesterId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
      refreshNotifications();
      refreshFriends(); // Refresh friends list so search screen shows updated status
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

  // ── Loading / error states ──

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError || !profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.secondary} />
          <Text style={[styles.errorText, { color: colors.secondary }]}>
            {profileError ? 'Failed to load profile data' : 'No profile found'}
          </Text>
          {profileError && (
            <Text style={[styles.errorHint, { color: colors.muted }]}>
              Make sure you've run the database migrations
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Dynamic styles using theme colors ──

  const dynamicStyles = {
    safeArea: { backgroundColor: colors.background },
    card: { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
    ink: { color: colors.ink },
    muted: { color: colors.muted },
    primary: { color: colors.primary },
  };

  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.safeArea]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* ── Header: greeting + bell + avatar ── */}
        <ReAnimated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, dynamicStyles.ink]}>
              Hey, {profile.full_name?.split(' ')[0] || 'Player'}!
            </Text>
            <Text style={[styles.greetingSub, dynamicStyles.muted]}>
              Let's see how you're doing
            </Text>
          </View>
          <View style={styles.headerRight}>
            <AnimatedPressable
              style={[styles.bellButton, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
              onPress={openNotifications}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.ink} />
              {unreadCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </AnimatedPressable>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.headerAvatarText}>
                  {(profile.full_name || 'P')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </ReAnimated.View>

        {/* ── Hero: circular XP progress (center stage) ── */}
        <ReAnimated.View entering={FadeInDown.delay(100).duration(500)} style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroContent}>
            <View>
              <CircularProgress
                progress={levelProgress}
                size={170}
                strokeWidth={12}
                progressColor="#ffffff"
                trackColor="rgba(255,255,255,0.25)"
                centerLabel={`${profile.level}`}
                centerSub={`Level`}
                centerHint={`${xpInCurrentLevel} / ${xpNeededForLevel} XP`}
                labelColor="#ffffff"
                subColor="rgba(255,255,255,0.85)"
              />
              <ConfettiBurst
                playing={showConfetti}
                onComplete={() => setShowConfetti(false)}
              />
            </View>
            <Text style={styles.heroHint}>
              {winsToNext} {winsToNext === 1 ? 'win' : 'wins'} to Level {profile.level + 1}
            </Text>
          </View>
        </ReAnimated.View>

        {/* ── Quick stats row ── */}
        <ReAnimated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: colors.primary }]}>
            <Text style={styles.statChipValue}>{profile.wins}</Text>
            <Text style={styles.statChipLabel}>Wins</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.secondary }]}>
            <Text style={styles.statChipValue}>{profile.losses}</Text>
            <Text style={styles.statChipLabel}>Losses</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.borderLight }]}>
            <Text style={[styles.statChipValue, { color: colors.ink }]}>{rating?.rating ?? 1200}</Text>
            <LeagueLabel rating={rating?.rating ?? 1200} size="sm" />
          </View>
        </ReAnimated.View>

        {/* ── Ad banner ── */}
        <AdBanner adUnitId={AD_UNIT_IDS.HOME_BANNER} />

        {/* ── Recent matches ── */}
        <ReAnimated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.ink]}>Recent Matches</Text>
            <AnimatedPressable onPress={() => router.push('/match-history')}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>View all</Text>
            </AnimatedPressable>
          </View>

          {recentMatchesLoading ? (
            <View style={[styles.matchCardPlaceholder, dynamicStyles.card]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.placeholderText, dynamicStyles.muted]}>Loading matches...</Text>
            </View>
          ) : recentMatches.length === 0 ? (
            <View style={[styles.matchCardPlaceholder, dynamicStyles.card]}>
              <Ionicons name="game-controller-outline" size={32} color={colors.muted} />
              <Text style={[styles.placeholderText, dynamicStyles.muted]}>
                No matches yet. Play your first!
              </Text>
            </View>
          ) : (
            <View style={styles.matchList}>
              {recentMatches.map((match) => {
                const summary = formatRecentMatch(match);
                const isWin = summary.result === 'Win';
                return (
                  <View
                    key={match.id}
                    style={[
                      styles.matchCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: isWin ? colors.success : colors.borderLight,
                        borderWidth: isWin ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={styles.matchCardRow}>
                      <View style={[styles.matchBadge, { backgroundColor: isWin ? colors.winBg : colors.lossBg }]}>
                        <Text style={[styles.matchBadgeText, { color: isWin ? colors.success : colors.error }]}>
                          {summary.result}
                        </Text>
                      </View>
                      <View style={styles.matchCardInfo}>
                        <Text style={[styles.matchTitle, dynamicStyles.ink]} numberOfLines={1}>
                          {summary.title}
                        </Text>
                        <Text style={[styles.matchSubtitle, dynamicStyles.muted]}>
                          {summary.subtitle}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ReAnimated.View>

        {/* Spacer for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Notifications panel (slide-in) ── */}
      {isNotificationsOpen && (
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={closeNotifications} />
      )}
      <Animated.View
        pointerEvents={isNotificationsOpen ? 'auto' : 'none'}
        style={[
          styles.notificationsPanel,
          {
            width: panelWidth,
            backgroundColor: colors.surface,
            borderLeftColor: colors.border,
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
          <Text style={[styles.panelTitle, { color: colors.ink }]}>Notifications</Text>
          <AnimatedPressable
            style={[styles.panelClose, { borderColor: colors.border }]}
            onPress={closeNotifications}
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </AnimatedPressable>
        </View>
        <ScrollView contentContainerStyle={styles.panelList}>
          {notifications.length === 0 && (
            <View style={styles.panelEmpty}>
              <Text style={[styles.panelEmptyText, { color: colors.muted }]}>No notifications yet</Text>
            </View>
          )}
          {notifications
            .filter((notification) => !(
              (notification.type === 'match_approval' || notification.type === 'friend_request') && notification.read
            ))
            .filter((notification) => !dismissedNotifications.has(notification.id))
            .map((notification) => {
            const parsedData = (() => {
              if (!notification.data) return {} as Record<string, unknown>;
              if (typeof notification.data === 'string') {
                try {
                  return JSON.parse(notification.data) as Record<string, unknown>;
                } catch {
                  return {} as Record<string, unknown>;
                }
              }
              return notification.data as Record<string, unknown>;
            })();

            const matchId =
              (parsedData.match_id as string | undefined) ||
              (parsedData.matchId as string | undefined);
            const requesterId =
              (parsedData.requester_id as string | undefined) ||
              (parsedData.requesterId as string | undefined);
            const pendingMatch = matchId ? pendingMatchById.get(matchId) : undefined;
            const requester = requesterId ? pendingFriendById.get(requesterId) : undefined;
            const matchSummary = pendingMatch ? formatMatchSummary(pendingMatch) : null;
            const requesterName = requester?.full_name || 'Someone';

            return (
              <View key={notification.id} style={[
                styles.panelCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
                !notification.read && { borderColor: colors.unreadBorder, backgroundColor: colors.unreadBg },
              ]}>
                <View style={styles.panelCardHeader}>
                  <Text style={[styles.panelCardTitle, { color: colors.ink }]}>{notification.title}</Text>
                  <Text style={[styles.panelCardTime, { color: colors.muted }]}>{new Date(notification.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.panelCardMessage, { color: colors.ink }]}>{notification.message}</Text>

                {notification.type === 'match_approval' && (
                  <View style={styles.panelDetails}>
                    {matchSummary ? (
                      <>
                        <Text style={[styles.panelDetailText, { color: colors.muted }]}>{matchSummary.title}</Text>
                        <Text style={[styles.panelDetailText, { color: colors.muted }]}>{matchSummary.teams}</Text>
                        <Text style={[styles.panelDetailText, { color: colors.muted }]}>Score: {matchSummary.score}</Text>
                        <Text style={[styles.panelDetailText, { color: colors.muted }]}>Winner: {matchSummary.winner}</Text>
                      </>
                    ) : (
                      <Text style={[styles.panelDetailText, { color: colors.muted }]}>Match details unavailable.</Text>
                    )}
                    <View style={styles.panelActions}>
                      <AnimatedPressable
                        style={[styles.panelButton, { borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                        onPress={() => matchId && handleRejectMatchNotification(matchId, notification.id)}
                      >
                        <Text style={[styles.panelButtonText, { color: colors.muted }]}>Decline</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        style={[styles.panelButton, { backgroundColor: colors.primary }]}
                        onPress={() => matchId && handleApproveMatchNotification(matchId, notification.id)}
                      >
                        <Text style={[styles.panelButtonText, { color: colors.textOnPrimary }]}>Approve</Text>
                      </AnimatedPressable>
                    </View>
                  </View>
                )}

                {notification.type === 'friend_request' && (
                  <View style={styles.panelDetails}>
                    <Text style={[styles.panelDetailText, { color: colors.muted }]}>{requesterName} sent you a friend request.</Text>
                    <View style={styles.panelActions}>
                      <AnimatedPressable
                        style={[styles.panelButton, { borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                        onPress={() => requesterId && handleRejectFriendNotification(requesterId, notification.id)}
                      >
                        <Text style={[styles.panelButtonText, { color: colors.muted }]}>Decline</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        style={[styles.panelButton, { backgroundColor: colors.primary }]}
                        onPress={() => requesterId && handleAcceptFriendNotification(requesterId, notification.id)}
                      >
                        <Text style={[styles.panelButtonText, { color: colors.textOnPrimary }]}>Accept</Text>
                      </AnimatedPressable>
                    </View>
                  </View>
                )}

                {notification.type === 'achievement' && notification.data?.details && (
                  <View style={styles.panelDetails}>
                    <Text style={[styles.panelDetailText, { color: colors.muted }]}>{notification.data.details}</Text>
                  </View>
                )}

                {/* Show mark as read only for notifications without action buttons */}
                {!notification.read && notification.type !== 'match_approval' && notification.type !== 'friend_request' && (
                  <Pressable
                    style={styles.panelMarkRead}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <Text style={[styles.panelMarkReadText, { color: colors.primary }]}>Mark as read</Text>
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

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },

  // Loading / error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.base,
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
    textAlign: 'center',
  },
  errorHint: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  greetingSub: {
    fontSize: typography.sizes.base,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#ffffff',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },

  // Hero XP card
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  heroContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.sizes.sm,
  },

  // Quick stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  statChipValue: {
    color: '#ffffff',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statChipLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },

  // Pending actions
  pendingCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4538',
    marginTop: 4,
  },
  pendingContent: {
    flex: 1,
    gap: spacing.xs,
  },
  pendingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  pendingBody: {
    fontSize: typography.sizes.sm,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pendingBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  pendingBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  sectionLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },

  // Recent matches (vertical list)
  matchList: {
    gap: spacing.sm,
  },
  matchCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  matchCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchCardInfo: {
    flex: 1,
    gap: 2,
  },
  matchCardPlaceholder: {
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  placeholderText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  matchBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  matchTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  matchSubtitle: {
    fontSize: typography.sizes.sm,
  },

  // Notification panel
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  notificationsPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: 1,
    paddingTop: 54,
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
  },
  panelClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: typography.sizes.sm,
  },
  panelCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  panelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  panelCardTime: {
    fontSize: typography.sizes.xs,
    marginLeft: spacing.sm,
  },
  panelCardMessage: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  panelDetails: {
    marginTop: spacing.xs,
    gap: 4,
  },
  panelDetailText: {
    fontSize: typography.sizes.sm,
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
  panelButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  panelMarkRead: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  panelMarkReadText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
