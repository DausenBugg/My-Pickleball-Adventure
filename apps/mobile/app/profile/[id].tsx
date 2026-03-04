import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '../../src/components/AnimatedPressable';
import { LeagueRatingBadge, LeagueLabel } from '../../src/components/LeagueBadge';
import { useUserProfile } from '../../src/hooks/useUserProfile';
import { useHeadToHead } from '../../src/hooks/useHeadToHead';
import { useRank } from '../../src/hooks/useRank';
import { useFriends } from '../../src/hooks/useFriends';
import { useAuth } from '../../src/state/auth';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';

// ── Skeleton placeholder ──
function SkeletonBlock({ width, height, style, colors }: { width: number | string; height: number; style?: any; colors: any }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[
        {
          width,
          height,
          borderRadius: radii.md,
          backgroundColor: colors.shimmer,
        },
        style,
      ]}
    />
  );
}

function ProfileSkeleton({ colors }: { colors: any }) {
  return (
    <View style={skeletonStyles.container}>
      {/* Avatar */}
      <SkeletonBlock width={100} height={100} style={{ borderRadius: 50, alignSelf: 'center' }} colors={colors} />
      {/* Name */}
      <SkeletonBlock width={180} height={22} style={{ alignSelf: 'center', marginTop: 16 }} colors={colors} />
      {/* Level */}
      <SkeletonBlock width={80} height={16} style={{ alignSelf: 'center', marginTop: 8 }} colors={colors} />
      {/* Stats row */}
      <View style={skeletonStyles.statsRow}>
        <SkeletonBlock width={'30%'} height={70} colors={colors} />
        <SkeletonBlock width={'30%'} height={70} colors={colors} />
        <SkeletonBlock width={'30%'} height={70} colors={colors} />
      </View>
      {/* Achievements */}
      <SkeletonBlock width={140} height={18} style={{ marginTop: 20 }} colors={colors} />
      <View style={skeletonStyles.achRow}>
        <SkeletonBlock width={60} height={60} style={{ borderRadius: radii.lg }} colors={colors} />
        <SkeletonBlock width={60} height={60} style={{ borderRadius: radii.lg }} colors={colors} />
        <SkeletonBlock width={60} height={60} style={{ borderRadius: radii.lg }} colors={colors} />
        <SkeletonBlock width={60} height={60} style={{ borderRadius: radii.lg }} colors={colors} />
      </View>
      {/* Match history */}
      <SkeletonBlock width={140} height={18} style={{ marginTop: 20 }} colors={colors} />
      <SkeletonBlock width={'100%'} height={70} style={{ marginTop: 8 }} colors={colors} />
      <SkeletonBlock width={'100%'} height={70} style={{ marginTop: 8 }} colors={colors} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: spacing.sm },
  achRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 10 },
});

// ── Main screen ──

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useAuth();
  const isOwnProfile = session?.user?.id === id;
  const { profile, rating, achievements, matchHistory, loading, error } = useUserProfile(id ?? null);
  const { rank } = useRank(id ?? null);
  const { friends, pendingSent, sendFriendRequest } = useFriends();
  const { stats: h2hStats, loading: h2hLoading } = useHeadToHead(isOwnProfile ? null : id ?? null);

  const friendStatus = useMemo(() => {
    if (!id) return 'none' as const;
    if (friends.includes(id)) return 'friend' as const;
    if (pendingSent.includes(id)) return 'pending' as const;
    return 'none' as const;
  }, [id, friends, pendingSent]);

  const winRate = useMemo(() => {
    if (!profile) return 0;
    const total = profile.wins + profile.losses;
    if (total === 0) return 0;
    return Math.round((profile.wins / total) * 100);
  }, [profile]);

  const handleAddFriend = async () => {
    if (!id) return;
    await sendFriendRequest(id);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Header bar */}
        <View style={styles.headerBar}>
          <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </AnimatedPressable>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <ProfileSkeleton colors={colors} />
        ) : error || !profile ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.secondary} />
            <Text style={[styles.errorText, { color: colors.secondary }]}>
              {error || 'Profile not found'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* ── Hero section ── */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.heroSection}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {(profile.full_name || 'P')[0].toUpperCase()}
                  </Text>
                </View>
              )}

              <Text style={[styles.name, { color: colors.ink }]}>
                {profile.full_name || 'Player'}
              </Text>
              <Text style={[styles.levelText, { color: colors.muted }]}>
                Level {profile.level}
              </Text>

              {/* Rating badge */}
              <View style={{ marginTop: spacing.sm }}>
                <LeagueRatingBadge rating={rating?.rating ?? 1200} rank={rank ?? undefined} />
              </View>

              {/* Add friend button — hidden on own profile */}
              {!isOwnProfile && (
                <AnimatedPressable
                  style={[
                    styles.friendButton,
                    { backgroundColor: colors.secondary },
                    friendStatus === 'friend' ? { backgroundColor: colors.borderLight } : {},
                    friendStatus === 'pending' ? { backgroundColor: colors.secondaryGhost } : {},
                  ]}
                  onPress={friendStatus === 'none' ? handleAddFriend : undefined}
                  disabled={friendStatus !== 'none'}
                >
                  <Ionicons
                    name={friendStatus === 'friend' ? 'people' : friendStatus === 'pending' ? 'time-outline' : 'person-add'}
                    size={16}
                    color={friendStatus !== 'none' ? colors.muted : '#ffffff'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.friendButtonText,
                      friendStatus !== 'none' ? { color: colors.muted } : undefined,
                    ]}
                  >
                    {friendStatus === 'friend' ? 'Friends' : friendStatus === 'pending' ? 'Pending' : 'Add Friend'}
                  </Text>
                </AnimatedPressable>
              )}
            </Animated.View>

            {/* ── Stats row ── */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{rating?.rating ?? 1200}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Rating</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{rating?.games_played ?? 0}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Games</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{winRate}%</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Win Rate</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
              <View style={[styles.statChip, { backgroundColor: colors.primary }]}>
                <Text style={styles.statChipValue}>{profile.wins}</Text>
                <Text style={styles.statChipLabel}>Wins</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: colors.secondary }]}>
                <Text style={styles.statChipValue}>{profile.losses}</Text>
                <Text style={styles.statChipLabel}>Losses</Text>
              </View>
            </Animated.View>

            {/* ── Head-to-Head (only on other users' profiles) ── */}
            {!isOwnProfile && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                    Head-to-Head
                  </Text>
                </View>

                {h2hLoading ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : !h2hStats || h2hStats.totalGames === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                    <Ionicons name="people-outline" size={28} color={colors.muted} />
                    <Text style={[styles.emptyText, { color: colors.muted }]}>No matches played together yet</Text>
                  </View>
                ) : (
                  <View>
                    <View style={styles.statsRow}>
                      <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{h2hStats.myWins}</Text>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>Your Wins</Text>
                      </View>
                      <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                        <Text style={[styles.statValue, { color: colors.error }]}>{h2hStats.theirWins}</Text>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>Their Wins</Text>
                      </View>
                      <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{h2hStats.totalGames}</Text>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
                      </View>
                    </View>
                    <View style={styles.h2hMeta}>
                      <Text style={[styles.h2hMetaText, { color: colors.muted }]}>
                        Avg Score Diff: {h2hStats.avgScoreDiff > 0 ? '+' : ''}{h2hStats.avgScoreDiff}
                      </Text>
                      {h2hStats.myCurrentStreak > 0 && (
                        <Text style={[styles.h2hMetaText, { color: colors.success }]}>
                          🔥 {h2hStats.myCurrentStreak} win streak
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ── Achievements ── */}
            <Animated.View entering={FadeInDown.delay(!isOwnProfile ? 300 : 200).duration(400)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  Achievements ({achievements.length})
                </Text>
              </View>

              {achievements.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                  <Ionicons name="trophy-outline" size={28} color={colors.muted} />
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No achievements yet</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
                  {achievements.map((ach) => (
                    <View
                      key={ach.id}
                      style={[styles.achievementCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
                    >
                      <Text style={styles.achievementIcon}>{ach.icon}</Text>
                      <Text style={[styles.achievementName, { color: colors.ink }]} numberOfLines={2}>
                        {ach.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </Animated.View>

            {/* ── Match history ── */}
            <Animated.View entering={FadeInDown.delay(!isOwnProfile ? 400 : 300).duration(400)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="game-controller" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  Recent Matches
                </Text>
              </View>

              {matchHistory.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                  <Ionicons name="game-controller-outline" size={28} color={colors.muted} />
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No matches played yet</Text>
                </View>
              ) : (
                <View style={styles.matchList}>
                  {matchHistory.map((match) => {
                    const teamA = match.participants
                      .filter((p) => p.team === 'team_a')
                      .map((p) => p.full_name || 'Player')
                      .join(' & ');
                    const teamB = match.participants
                      .filter((p) => p.team === 'team_b')
                      .map((p) => p.full_name || 'Player')
                      .join(' & ');

                    return (
                      <AnimatedPressable
                        key={match.id}
                        onPress={() => router.push(`/match/${match.id}`)}
                        style={[
                          styles.matchCard,
                          {
                            backgroundColor: colors.cardBackground,
                            borderColor: match.user_won ? colors.success : colors.borderLight,
                            borderWidth: match.user_won ? 1.5 : 1,
                          },
                        ]}
                      >
                        <View style={styles.matchCardRow}>
                          <View style={[styles.matchBadge, { backgroundColor: match.user_won ? colors.winBg : colors.lossBg }]}>
                            <Text style={[styles.matchBadgeText, { color: match.user_won ? colors.success : colors.error }]}>
                              {match.user_won ? 'Win' : 'Loss'}
                            </Text>
                          </View>
                          <View style={styles.matchCardInfo}>
                            <Text style={[styles.matchTitle, { color: colors.ink }]} numberOfLines={1}>
                              {teamA} vs {teamB}
                            </Text>
                            <Text style={[styles.matchSubtitle, { color: colors.muted }]}>
                              {match.match_mode === 'ranked' ? 'Ranked' : 'Casual'} · {match.team_a_score} - {match.team_b_score}
                            </Text>
                          </View>
                        </View>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              )}
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: typography.weights.bold,
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  levelText: {
    fontSize: typography.sizes.base,
    marginTop: 4,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    marginTop: spacing.md,
  },
  friendButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
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

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  emptyCard: {
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },

  // Achievements
  achievementsScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  achievementCard: {
    width: 80,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },

  // Match history
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

  // Head-to-Head
  h2hMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  h2hMetaText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
