import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useMatches, MatchFilters } from '../src/hooks/useMatches';
import { useTheme } from '../src/theme';
import { radii, shadows, spacing, typography } from '../src/theme/tokens';
import { useAuth } from '../src/state/auth';
import AnimatedPressable from '../src/components/AnimatedPressable';

export default function MatchHistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useTheme();
  const [filters, setFilters] = useState<MatchFilters>({
    matchType: 'all',
    isRanked: 'all',
    result: 'all',
    status: 'approved',
  });

  const { matches, loading, error } = useMatches(filters);

  const FilterButton = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <AnimatedPressable
      style={[
        styles.filterButton,
        { backgroundColor: colors.borderLight, borderColor: colors.borderLight },
        active ? { backgroundColor: colors.primary, borderColor: colors.primary } : {},
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          { color: colors.muted },
          active ? { color: colors.textOnPrimary } : undefined,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );

  const Avatar = ({ url, name }: { url: string | null; name: string }) => {
    if (url) {
      return <Image source={{ uri: url }} style={styles.playerAvatar} />;
    }
    return (
      <View style={[styles.playerAvatarPlaceholder, { backgroundColor: colors.primary }]}>
        <Text style={styles.playerAvatarText}>{name[0]?.toUpperCase() || 'P'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </AnimatedPressable>
          <Text style={[styles.title, { color: colors.ink }]}>Match History</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Your complete match record</Text>
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.filters, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <View style={styles.filterRow}>
              <Text style={[styles.filterLabel, { color: colors.muted }]}>Type:</Text>
            <View style={styles.filterButtons}>
              <FilterButton
                label="All"
                active={filters.matchType === 'all'}
                onPress={() => setFilters({ ...filters, matchType: 'all' })}
              />
              <FilterButton
                label="Singles"
                active={filters.matchType === 'singles'}
                onPress={() => setFilters({ ...filters, matchType: 'singles' })}
              />
              <FilterButton
                label="Doubles"
                active={filters.matchType === 'doubles'}
                onPress={() => setFilters({ ...filters, matchType: 'doubles' })}
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.muted }]}>Mode:</Text>
            <View style={styles.filterButtons}>
              <FilterButton
                label="All"
                active={filters.isRanked === 'all'}
                onPress={() => setFilters({ ...filters, isRanked: 'all' })}
              />
              <FilterButton
                label="Ranked"
                active={filters.isRanked === true}
                onPress={() => setFilters({ ...filters, isRanked: true })}
              />
              <FilterButton
                label="Casual"
                active={filters.isRanked === false}
                onPress={() => setFilters({ ...filters, isRanked: false })}
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.muted }]}>Result:</Text>
            <View style={styles.filterButtons}>
              <FilterButton
                label="All"
                active={filters.result === 'all'}
                onPress={() => setFilters({ ...filters, result: 'all' })}
              />
              <FilterButton
                label="Wins"
                active={filters.result === 'wins'}
                onPress={() => setFilters({ ...filters, result: 'wins' })}
              />
              <FilterButton
                label="Losses"
                active={filters.result === 'losses'}
                onPress={() => setFilters({ ...filters, result: 'losses' })}
              />
            </View>
          </View>
        </View>
        </Animated.View>

        {/* Matches */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading matches...</Text>
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.secondaryGhost, borderColor: colors.secondary }]}>
            {error.includes('does not exist') && error.includes('match_participants') ? (
              <>
                <Text style={[styles.errorText, { color: colors.secondary }]}>No matches logged yet</Text>
                <Text style={[styles.errorHint, { color: colors.muted }]}>
                  Play your first match to start tracking your history.
                </Text>
              </>
            ) : (
              <Text style={[styles.errorText, { color: colors.secondary }]}>Error: {error}</Text>
            )}
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={44} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.ink }]}>No matches found</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Try adjusting your filters or play some matches!
            </Text>
          </View>
        ) : (
          <View style={styles.matchList}>
            {matches.map((match) => {
              // Safety checks
              if (!match || !match.team1_player1 || !match.team2_player1) {
                return null;
              }

              const team1Ids = [
                match.team1_player1?.id,
                match.team1_player2?.id,
              ].filter(Boolean);
              const userInTeam1 = team1Ids.includes(session?.user?.id || '');
              const userWon =
                (userInTeam1 && match.winning_team === 1) ||
                (!userInTeam1 && match.winning_team === 2);

              return (
                <Animated.View
                  key={match.id}
                  entering={FadeInDown.delay(200 + (matches.indexOf(match)) * 50).duration(400)}
                >
                <View
                  style={[
                    styles.matchCard,
                    { backgroundColor: colors.cardBackground },
                    userWon
                      ? { borderColor: colors.success }
                      : { borderColor: colors.secondary },
                  ]}
                >
                  <View style={styles.matchHeader}>
                    <View style={styles.matchMeta}>
                      <Text style={[styles.matchType, { color: colors.muted }]}>
                        {match.match_type === 'singles' ? '1v1' : '2v2'}
                      </Text>
                      {match.is_ranked && (
                        <View style={[styles.rankedBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.rankedText}>RANKED</Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        styles.resultBadge,
                        { backgroundColor: userWon ? colors.successGhost : colors.secondaryGhost },
                      ]}
                    >
                      <Text
                        style={[
                          styles.resultText,
                          { color: userWon ? colors.success : colors.secondary },
                        ]}
                      >
                        {userWon ? 'WIN' : 'LOSS'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.matchTeams}>
                    {/* Team 1 */}
                    {match.team1_player1 && (
                      <View style={styles.team}>
                        <View style={styles.teamPlayers}>
                          <Avatar
                            url={match.team1_player1.avatar_url}
                            name={match.team1_player1.full_name || 'Player'}
                          />
                          <Text style={[styles.playerName, { color: colors.ink }]} numberOfLines={1}>
                            {match.team1_player1.full_name || 'Player'}
                          </Text>
                          {match.team1_player2 && (
                            <>
                              <Avatar
                                url={match.team1_player2.avatar_url}
                                name={match.team1_player2.full_name || 'Player'}
                              />
                              <Text style={[styles.playerName, { color: colors.ink }]} numberOfLines={1}>
                                {match.team1_player2.full_name || 'Player'}
                              </Text>
                            </>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.teamScore,
                            { color: colors.muted },
                            match.winning_team === 1 && { color: colors.ink },
                          ]}
                        >
                          {match.score_team1}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.vs, { color: colors.muted }]}>vs</Text>

                    {/* Team 2 */}
                    {match.team2_player1 && (
                      <View style={styles.team}>
                        <View style={styles.teamPlayers}>
                          <Avatar
                            url={match.team2_player1.avatar_url}
                            name={match.team2_player1.full_name || 'Player'}
                          />
                          <Text style={[styles.playerName, { color: colors.ink }]} numberOfLines={1}>
                            {match.team2_player1.full_name || 'Player'}
                          </Text>
                          {match.team2_player2 && (
                            <>
                              <Avatar
                                url={match.team2_player2.avatar_url}
                                name={match.team2_player2.full_name || 'Player'}
                              />
                              <Text style={[styles.playerName, { color: colors.ink }]} numberOfLines={1}>
                                {match.team2_player2.full_name || 'Player'}
                              </Text>
                            </>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.teamScore,
                            { color: colors.muted },
                            match.winning_team === 2 && { color: colors.ink },
                          ]}
                        >
                          {match.score_team2}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.matchDate, { color: colors.muted }]}>
                    {new Date(match.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                </Animated.View>
              );
            })}
          </View>
        )}
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
    gap: spacing.lg,
  },
  header: {
    gap: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.base,
  },
  filters: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  filterRow: {
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
  },
  errorContainer: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  errorText: {
    fontSize: typography.sizes.sm,
  },
  errorHint: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  matchList: {
    gap: spacing.md,
  },
  matchCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 2,
    ...shadows.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  matchType: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  rankedBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  rankedText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  resultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  resultText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  matchTeams: {
    gap: spacing.xs,
  },
  team: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamPlayers: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  playerAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  playerName: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  teamScore: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  vs: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    fontWeight: typography.weights.semibold,
  },
  matchDate: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
});
