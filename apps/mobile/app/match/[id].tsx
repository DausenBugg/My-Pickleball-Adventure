import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
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
import { LeagueLabel } from '../../src/components/LeagueBadge';
import AdBanner from '../../src/components/AdBanner';
import { AD_UNIT_IDS } from '../../src/lib/adUnitIds';
import {
  useMatchDetail,
  MatchDetailPlayer,
  MatchApproval,
} from '../../src/hooks/useMatchDetail';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';

function Avatar({
  url,
  name,
  size = 36,
  colors,
}: {
  url: string | null;
  name: string;
  size?: number;
  colors: any;
}) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarPlaceholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
        {(name || 'P')[0].toUpperCase()}
      </Text>
    </View>
  );
}

function SkeletonBlock({
  width,
  height,
  style,
  colors,
}: {
  width: number | string;
  height: number;
  style?: any;
  colors: any;
}) {
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

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { match, loading, error, refresh } = useMatchDetail(id ?? null);

  const teamA = useMemo(
    () => match?.players.filter((p) => p.team === 'team_a') ?? [],
    [match]
  );
  const teamB = useMemo(
    () => match?.players.filter((p) => p.team === 'team_b') ?? [],
    [match]
  );

  const isRanked = match?.match_mode === 'ranked';
  const isApproved = match?.status === 'approved';
  const isPending = match?.status === 'pending';

  const statusConfig = useMemo(() => {
    if (!match) return { label: '', color: '', bg: '' };
    switch (match.status) {
      case 'approved':
        return { label: 'Approved', color: colors.success, bg: colors.successGhost };
      case 'pending':
        return { label: 'Pending', color: colors.warning, bg: `rgba(245,166,35,0.12)` };
      case 'rejected':
        return { label: 'Rejected', color: colors.error, bg: colors.secondaryGhost };
      default:
        return { label: match.status, color: colors.muted, bg: colors.shimmer };
    }
  }, [match, colors]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.headerBar}>
          <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </AnimatedPressable>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>Match Details</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonBlock width="100%" height={120} colors={colors} />
            <SkeletonBlock width="100%" height={150} style={{ marginTop: spacing.md }} colors={colors} />
            <SkeletonBlock width="100%" height={80} style={{ marginTop: spacing.md }} colors={colors} />
          </View>
        ) : error || !match ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.secondary} />
            <Text style={[styles.errorText, { color: colors.secondary }]}>
              {error || 'Match not found'}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {/* ── Hero card ── */}
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={[styles.heroCard, { backgroundColor: colors.primary }]}
            >
              <View style={styles.heroRow}>
                <View style={styles.heroBadges}>
                  <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.typeBadgeText}>
                      {match.match_type === 'singles' ? '1v1' : '2v2'}
                    </Text>
                  </View>
                  {isRanked && (
                    <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={styles.typeBadgeText}>RANKED</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroDate}>{formatDate(match.created_at)}</Text>
            </Animated.View>

            {/* ── Ad banner ── */}
            <AdBanner adUnitId={AD_UNIT_IDS.MATCH_DETAIL_BANNER} />

            {/* ── Teams & Scores ── */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.teamsContainer}
            >
              {/* Team A */}
              <View
                style={[
                  styles.teamCard,
                  {
                    backgroundColor: match.winner_team === 'team_a' ? colors.winBg : colors.cardBackground,
                    borderColor: match.winner_team === 'team_a' ? colors.success : colors.borderLight,
                  },
                ]}
              >
                {match.winner_team === 'team_a' && (
                  <View style={styles.winnerTag}>
                    <Ionicons name="trophy" size={12} color={colors.success} />
                    <Text style={[styles.winnerTagText, { color: colors.success }]}>Winner</Text>
                  </View>
                )}
                <Text style={[styles.teamScore, { color: colors.ink }]}>
                  {match.team_a_score}
                </Text>
                {teamA.map((player) => (
                  <AnimatedPressable
                    key={player.id}
                    style={styles.playerRow}
                    onPress={() => router.push(`/profile/${player.id}`)}
                  >
                    <Avatar url={player.avatar_url} name={player.full_name || 'P'} size={32} colors={colors} />
                    <View style={styles.playerInfo}>
                      <Text style={[styles.playerName, { color: colors.ink }]} numberOfLines={1}>
                        {player.full_name || 'Player'}
                      </Text>
                      <Text style={[styles.playerLevel, { color: colors.muted }]}>
                        Lv. {player.level}
                      </Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </View>

              <View style={styles.vsContainer}>
                <Text style={[styles.vsText, { color: colors.muted }]}>VS</Text>
              </View>

              {/* Team B */}
              <View
                style={[
                  styles.teamCard,
                  {
                    backgroundColor: match.winner_team === 'team_b' ? colors.winBg : colors.cardBackground,
                    borderColor: match.winner_team === 'team_b' ? colors.success : colors.borderLight,
                  },
                ]}
              >
                {match.winner_team === 'team_b' && (
                  <View style={styles.winnerTag}>
                    <Ionicons name="trophy" size={12} color={colors.success} />
                    <Text style={[styles.winnerTagText, { color: colors.success }]}>Winner</Text>
                  </View>
                )}
                <Text style={[styles.teamScore, { color: colors.ink }]}>
                  {match.team_b_score}
                </Text>
                {teamB.map((player) => (
                  <AnimatedPressable
                    key={player.id}
                    style={styles.playerRow}
                    onPress={() => router.push(`/profile/${player.id}`)}
                  >
                    <Avatar url={player.avatar_url} name={player.full_name || 'P'} size={32} colors={colors} />
                    <View style={styles.playerInfo}>
                      <Text style={[styles.playerName, { color: colors.ink }]} numberOfLines={1}>
                        {player.full_name || 'Player'}
                      </Text>
                      <Text style={[styles.playerLevel, { color: colors.muted }]}>
                        Lv. {player.level}
                      </Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </View>
            </Animated.View>

            {/* ── Approval Status (only for pending matches) ── */}
            {isPending && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                    Approval Status
                  </Text>
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  {match.approvals.map((approval) => (
                    <View key={approval.user_id} style={styles.approvalRow}>
                      <Avatar
                        url={approval.avatar_url}
                        name={approval.full_name || 'P'}
                        size={28}
                        colors={colors}
                      />
                      <Text
                        style={[styles.approvalName, { color: colors.ink }]}
                        numberOfLines={1}
                      >
                        {approval.full_name || 'Player'}
                      </Text>
                      {approval.approved === true && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      )}
                      {approval.approved === false && (
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      )}
                      {approval.approved === null && (
                        <Ionicons name="time-outline" size={20} color={colors.warning} />
                      )}
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── Rating Changes (ranked + approved only) ── */}
            {isRanked && isApproved && match.ratingChanges.length > 0 && (
              <Animated.View entering={FadeInDown.delay(isPending ? 300 : 200).duration(400)}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trending-up" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                    Rating Changes
                  </Text>
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  {match.ratingChanges.map((rc) => {
                    const isPositive = rc.rating_change >= 0;
                    return (
                      <View key={rc.user_id} style={styles.ratingRow}>
                        <Text
                          style={[styles.ratingName, { color: colors.ink }]}
                          numberOfLines={1}
                        >
                          {rc.full_name || 'Player'}
                        </Text>
                        <View style={styles.ratingValues}>
                          <Text style={[styles.ratingOld, { color: colors.muted }]}>
                            {rc.old_rating}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={colors.muted}
                          />
                          <Text style={[styles.ratingNew, { color: colors.ink }]}>
                            {rc.new_rating}
                          </Text>
                          <View
                            style={[
                              styles.ratingDelta,
                              {
                                backgroundColor: isPositive
                                  ? colors.successGhost
                                  : colors.secondaryGhost,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.ratingDeltaText,
                                {
                                  color: isPositive
                                    ? colors.success
                                    : colors.error,
                                },
                              ]}
                            >
                              {isPositive ? '+' : ''}
                              {rc.rating_change}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── XP Awarded (approved only) ── */}
            {isApproved && match.xpEvents.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(
                  (isPending ? 300 : 200) + (isRanked && match.ratingChanges.length > 0 ? 100 : 0)
                ).duration(400)}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={18} color={colors.warning} />
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                    XP Awarded
                  </Text>
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  {match.xpEvents.map((xp) => (
                    <View key={xp.user_id} style={styles.xpRow}>
                      <Text
                        style={[styles.xpName, { color: colors.ink }]}
                        numberOfLines={1}
                      >
                        {xp.full_name || 'Player'}
                      </Text>
                      <View style={[styles.xpBadge, { backgroundColor: colors.primaryGhost }]}>
                        <Text style={[styles.xpBadgeText, { color: colors.primary }]}>
                          +{xp.xp_amount} XP
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── Timestamps ── */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.borderLight,
                  marginTop: spacing.md,
                },
              ]}
            >
              <View style={styles.timestampRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                <Text style={[styles.timestampLabel, { color: colors.muted }]}>Submitted</Text>
                <Text style={[styles.timestampValue, { color: colors.ink }]}>
                  {formatDate(match.created_at)}
                </Text>
              </View>
              {match.finalized_at && (
                <View style={[styles.timestampRow, { marginTop: spacing.xs }]}>
                  <Ionicons name="checkmark-done" size={16} color={colors.muted} />
                  <Text style={[styles.timestampLabel, { color: colors.muted }]}>Finalized</Text>
                  <Text style={[styles.timestampValue, { color: colors.ink }]}>
                    {formatDate(match.finalized_at)}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Spacer for floating tab bar */}
            <View style={{ height: 100 }} />
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
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },

  // Hero
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },

  // Teams
  teamsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  winnerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winnerTagText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamScore: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.heavy,
  },
  vsContainer: {
    paddingHorizontal: 4,
  },
  vsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  playerLevel: {
    fontSize: typography.sizes.xs,
  },

  // Avatar
  avatar: {},
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
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
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadows.sm,
  },

  // Approvals
  approvalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  approvalName: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },

  // Rating changes
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ratingName: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  ratingValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingOld: {
    fontSize: typography.sizes.sm,
  },
  ratingNew: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  ratingDelta: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  ratingDeltaText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },

  // XP
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  xpName: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  xpBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  xpBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },

  // Timestamps
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timestampLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  timestampValue: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'right',
  },
});
