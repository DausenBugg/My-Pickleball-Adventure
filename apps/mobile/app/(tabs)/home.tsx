import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

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
import {
  AppScreen,
  EmptyState,
  GlassCard,
  GradientHeader,
  IconButton,
  MetricTile,
  NotificationDrawer,
  PrimaryButton,
} from '../../src/components/ui';
import { useAppTheme } from '../../src/theme';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const { profile, loading: profileLoading, error: profileError, refresh: refreshProfile } = useProfile();
  const { rating, loading: ratingLoading, refresh: refreshRating } = useRating();
  const { matches: pendingMatches, approveMatch, rejectMatch, refresh: refreshPendingMatches } = usePendingMatches();
  const { pendingReceived, pendingReceivedUsers, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const { matches: recentMatchesRaw, loading: recentMatchesLoading, refresh: refreshRecentMatches } = useMatches({ status: 'approved' });
  const { notifications, unreadCount, markAsRead, refresh: refreshNotifications } = useNotifications();

  const [showFriendPrompt, setShowFriendPrompt] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const panelWidth = Math.min(360, Dimensions.get('window').width * 0.9);

  const loading = profileLoading || ratingLoading;

  const xpToNext = useMemo(() => (profile ? calculateXPToNextLevel(profile.level, profile.total_xp) : 0), [profile]);
  const levelProgress = useMemo(() => (profile ? calculateLevelProgress(profile.level, profile.total_xp) : 0), [profile]);
  const xpForCurrentLevel = useMemo(() => (profile ? calculateXPForLevel(profile.level) : 0), [profile]);
  const xpForNextLevel = useMemo(() => (profile ? calculateXPForLevel(profile.level + 1) : 0), [profile]);
  const xpInCurrentLevel = useMemo(() => (profile ? Math.max(0, profile.total_xp - xpForCurrentLevel) : 0), [profile, xpForCurrentLevel]);
  const xpNeededForLevel = useMemo(() => Math.max(1, xpForNextLevel - xpForCurrentLevel), [xpForCurrentLevel, xpForNextLevel]);
  const winsToNext = useMemo(() => Math.ceil(xpToNext / 120), [xpToNext]);

  const pendingMatchById = useMemo(() => new Map(pendingMatches.map((match) => [match.id, match])), [pendingMatches]);
  const pendingFriendById = useMemo(() => new Map(pendingReceivedUsers.map((user) => [user.id, user])), [pendingReceivedUsers]);
  const recentMatches = useMemo(() => recentMatchesRaw.slice(0, 5), [recentMatchesRaw]);

  useEffect(() => {
    if (pendingReceivedUsers.length === 0) {
      setShowFriendPrompt(false);
      return;
    }

    setShowFriendPrompt(true);
    const timer = setTimeout(() => setShowFriendPrompt(false), 8000);
    return () => clearTimeout(timer);
  }, [pendingReceivedUsers.length]);

  const refreshAll = async () => {
    await Promise.all([
      refreshProfile(),
      refreshRating(),
      refreshPendingMatches(),
      refreshNotifications(),
      refreshRecentMatches(),
    ]);
  };

  const openNotifications = () => {
    setIsNotificationsOpen(true);
    refreshNotifications();
    refreshPendingMatches();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: theme.motion.normal,
      useNativeDriver: true,
    }).start();
  };

  const closeNotifications = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: theme.motion.normal,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsNotificationsOpen(false);
    });
  };

  const handleApproveMatchNotification = async (matchId: string, notificationId?: string) => {
    const success = await approveMatch(matchId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
      await refreshAll();
    }
  };

  const handleRejectMatchNotification = async (matchId: string, notificationId?: string) => {
    const success = await rejectMatch(matchId);
    if (success) {
      if (notificationId) await markAsRead(notificationId);
      await refreshAll();
    }
  };

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

  const handleAcceptFriendNotification = async (requesterId: string, notificationId?: string) => {
    const success = await acceptFriendRequest(requesterId);
    if (success && notificationId) await markAsRead(notificationId);
  };

  const handleRejectFriendNotification = async (requesterId: string, notificationId?: string) => {
    const success = await rejectFriendRequest(requesterId);
    if (success && notificationId) await markAsRead(notificationId);
  };

  const formatTeamNames = (match: PendingMatch, team: 'team_a' | 'team_b') =>
    match.participants
      .filter((participant) => participant.team === team)
      .map((participant) => participant.full_name || 'Player')
      .join(' & ');

  const formatMatchSummary = (match: PendingMatch) => {
    const teamA = formatTeamNames(match, 'team_a');
    const teamB = formatTeamNames(match, 'team_b');
    return {
      title: `${match.match_type === 'singles' ? 'Singles' : 'Doubles'} ${match.match_mode}`,
      teams: `${teamA} vs ${teamB}`,
      score: `${match.team_a_score} - ${match.team_b_score}`,
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
    const userOnTeamA = [match.team1_player1?.id, match.team1_player2?.id].filter(Boolean).includes(profile?.id || '');
    const userWon = match.winning_team === (userOnTeamA ? 1 : 2);
    const score = userOnTeamA ? `${match.score_team1} - ${match.score_team2}` : `${match.score_team2} - ${match.score_team1}`;

    return {
      title: `${userOnTeamA ? teamA : teamB} vs ${userOnTeamA ? teamB : teamA}`,
      subtitle: `${match.is_ranked ? 'Ranked' : 'Casual'} | ${score}`,
      result: userWon ? 'Win' : 'Loss',
    };
  };

  if (loading) {
    return (
      <AppScreen scrollable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={theme.color.role.primary} />
          <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>Loading your stats...</Text>
        </View>
      </AppScreen>
    );
  }

  if (profileError) {
    return (
      <AppScreen scrollable={false}>
        <EmptyState
          title="Failed to load profile data"
          subtitle="Make sure database migrations have run and try refreshing."
          icon="alert-circle-outline"
        />
      </AppScreen>
    );
  }

  if (!profile) {
    return (
      <AppScreen scrollable={false}>
        <EmptyState title="No profile found" subtitle="Sign out and sign back in to recreate your profile state." />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} colors={[theme.color.role.primary]} />}
      contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 120 }}
    >
      <GradientHeader
        title="Performance Hub"
        subtitle={`${profile.full_name || 'Player'} | Rating ${rating?.rating ?? 1200}`}
        right={<IconButton icon="notifications-outline" onPress={openNotifications} badgeCount={unreadCount} accessibilityLabel="Open notifications" />}
      />

      {showFriendPrompt && pendingReceivedUsers.length > 0 ? (
        <GlassCard style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.md }}>
            New friend request
          </Text>
          <Text style={{ color: theme.color.role.textSecondary, fontFamily: theme.type.family.body }}>
            {pendingReceivedUsers[0]?.full_name || 'Someone'} sent you a request.
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <PrimaryButton label="Decline" secondary onPress={handleRejectFriend} style={{ flex: 1 }} />
            <PrimaryButton label="Accept" onPress={handleAcceptFriend} style={{ flex: 1 }} />
          </View>
        </GlassCard>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <MetricTile label="Wins" value={profile.wins} style={{ width: '48%' }} accent="primary" />
        <MetricTile label="Losses" value={profile.losses} style={{ width: '48%' }} />
        <MetricTile label="Level" value={profile.level} style={{ width: '48%' }} accent="secondary" />
        <MetricTile label="XP to Next" value={xpToNext} style={{ width: '48%' }} />
      </View>

      <GlassCard>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.md }}>
            Level {profile.level} progress
          </Text>
          <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.sm }}>
            {xpInCurrentLevel} / {xpNeededForLevel} XP in this level
          </Text>
        </View>
        <View
          style={{
            marginTop: theme.spacing.sm,
            height: 12,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.role.primarySoft,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${levelProgress}%`,
              height: '100%',
              backgroundColor: theme.color.role.primary,
            }}
          />
        </View>
        <Text style={{ marginTop: theme.spacing.sm, color: theme.color.role.textSecondary, fontFamily: theme.type.family.body }}>
          About {winsToNext} win{winsToNext === 1 ? '' : 's'} to reach Level {profile.level + 1}.
        </Text>
      </GlassCard>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <PrimaryButton label="Pending Approvals" onPress={() => router.push('/approvals')} style={{ flex: 1 }} secondary />
        <PrimaryButton label="Match History" onPress={() => router.push('/match-history')} style={{ flex: 1 }} />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.md }}>
          Recent Matches
        </Text>
        {recentMatchesLoading ? (
          <GlassCard>
            <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>Loading recent matches...</Text>
          </GlassCard>
        ) : recentMatches.length === 0 ? (
          <EmptyState title="No matches logged yet" subtitle="Play your first match to see it here." icon="tennisball-outline" />
        ) : (
          recentMatches.map((match) => {
            const summary = formatRecentMatch(match);
            return (
              <GlassCard key={match.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi, fontSize: theme.type.sizes.base }}>
                      {summary.title}
                    </Text>
                    <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, marginTop: 4 }}>
                      {summary.subtitle}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: theme.radius.pill,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor:
                        summary.result === 'Win' ? theme.color.role.successSoft : theme.color.role.secondarySoft,
                    }}
                  >
                    <Text
                      style={{
                        color: summary.result === 'Win' ? theme.color.role.success : theme.color.role.secondary,
                        fontFamily: theme.type.family.bodySemi,
                        fontSize: theme.type.sizes.sm,
                      }}
                    >
                      {summary.result}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            );
          })
        )}
      </View>

      <NotificationDrawer
        open={isNotificationsOpen}
        panelWidth={panelWidth}
        slideAnim={slideAnim}
        notifications={notifications}
        onClose={closeNotifications}
        onMarkRead={markAsRead}
        renderActions={(notification) => {
          const matchId = notification.data?.match_id as string | undefined;
          const requesterId = notification.data?.requester_id as string | undefined;
          const pendingMatch = matchId ? pendingMatchById.get(matchId) : undefined;
          const requester = requesterId ? pendingFriendById.get(requesterId) : undefined;
          const matchSummary = pendingMatch ? formatMatchSummary(pendingMatch) : null;

          if (notification.type === 'match_approval' && matchId) {
            return (
              <View style={{ gap: theme.spacing.sm }}>
                {matchSummary ? (
                  <View style={{ gap: 2 }}>
                    <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>{matchSummary.title}</Text>
                    <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>{matchSummary.teams}</Text>
                    <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>Score: {matchSummary.score}</Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <PrimaryButton label="Decline" secondary onPress={() => handleRejectMatchNotification(matchId, notification.id)} style={{ flex: 1 }} />
                  <PrimaryButton label="Approve" onPress={() => handleApproveMatchNotification(matchId, notification.id)} style={{ flex: 1 }} />
                </View>
              </View>
            );
          }

          if (notification.type === 'friend_request' && requesterId) {
            return (
              <View style={{ gap: theme.spacing.sm }}>
                <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>
                  {(requester?.full_name || 'Someone') + ' sent you a friend request.'}
                </Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <PrimaryButton label="Decline" secondary onPress={() => handleRejectFriendNotification(requesterId, notification.id)} style={{ flex: 1 }} />
                  <PrimaryButton label="Accept" onPress={() => handleAcceptFriendNotification(requesterId, notification.id)} style={{ flex: 1 }} />
                </View>
              </View>
            );
          }

          if (notification.type === 'achievement' && notification.data?.details) {
            return (
              <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>
                {String(notification.data.details)}
              </Text>
            );
          }

          return null;
        }}
      />
    </AppScreen>
  );
}
