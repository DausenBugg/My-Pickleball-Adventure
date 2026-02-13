import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useMatches, MatchFilters } from '../src/hooks/useMatches';
import { colors, radii, spacing, typography } from '../src/theme';
import { useAuth } from '../src/state/auth';

export default function MatchHistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
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
    <Pressable
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.filterText, active && styles.filterTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const Avatar = ({ url, name }: { url: string | null; name: string }) => {
    if (url) {
      return <Image source={{ uri: url }} style={styles.playerAvatar} />;
    }
    return (
      <View style={styles.playerAvatarPlaceholder}>
        <Text style={styles.playerAvatarText}>{name[0]?.toUpperCase() || 'P'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Match History</Text>
          <Text style={styles.subtitle}>Your complete match record</Text>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type:</Text>
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
            <Text style={styles.filterLabel}>Mode:</Text>
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
            <Text style={styles.filterLabel}>Result:</Text>
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

        {/* Matches */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.blue} />
            <Text style={styles.loadingText}>Loading matches...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            {error.includes('does not exist') && error.includes('match_participants') ? (
              <>
                <Text style={styles.errorText}>No matches logged yet</Text>
                <Text style={styles.errorHint}>
                  Play your first match to start tracking your history.
                </Text>
              </>
            ) : (
              <Text style={styles.errorText}>Error: {error}</Text>
            )}
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>
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
                <View
                  key={match.id}
                  style={[
                    styles.matchCard,
                    userWon ? styles.matchWin : styles.matchLoss,
                  ]}
                >
                  <View style={styles.matchHeader}>
                    <View style={styles.matchMeta}>
                      <Text style={styles.matchType}>
                        {match.match_type === 'singles' ? '1v1' : '2v2'}
                      </Text>
                      {match.is_ranked && (
                        <View style={styles.rankedBadge}>
                          <Text style={styles.rankedText}>RANKED</Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        styles.resultBadge,
                        userWon
                          ? styles.resultBadgeWin
                          : styles.resultBadgeLoss,
                      ]}
                    >
                      <Text
                        style={[
                          styles.resultText,
                          userWon
                            ? styles.resultTextWin
                            : styles.resultTextLoss,
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
                          <Text style={styles.playerName} numberOfLines={1}>
                            {match.team1_player1.full_name || 'Player'}
                          </Text>
                          {match.team1_player2 && (
                            <>
                              <Avatar
                                url={match.team1_player2.avatar_url}
                                name={match.team1_player2.full_name || 'Player'}
                              />
                              <Text style={styles.playerName} numberOfLines={1}>
                                {match.team1_player2.full_name || 'Player'}
                              </Text>
                            </>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.teamScore,
                            match.winning_team === 1 && styles.teamScoreWin,
                          ]}
                        >
                          {match.score_team1}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.vs}>vs</Text>

                    {/* Team 2 */}
                    {match.team2_player1 && (
                      <View style={styles.team}>
                        <View style={styles.teamPlayers}>
                          <Avatar
                            url={match.team2_player1.avatar_url}
                            name={match.team2_player1.full_name || 'Player'}
                          />
                          <Text style={styles.playerName} numberOfLines={1}>
                            {match.team2_player1.full_name || 'Player'}
                          </Text>
                          {match.team2_player2 && (
                            <>
                              <Avatar
                                url={match.team2_player2.avatar_url}
                                name={match.team2_player2.full_name || 'Player'}
                              />
                              <Text style={styles.playerName} numberOfLines={1}>
                                {match.team2_player2.full_name || 'Player'}
                              </Text>
                            </>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.teamScore,
                            match.winning_team === 2 && styles.teamScoreWin,
                          ]}
                        >
                          {match.score_team2}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.matchDate}>
                    {new Date(match.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
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
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: 6,
  },
  backButton: {
    marginBottom: spacing.xs,
  },
  backText: {
    color: colors.blue,
    fontSize: typography.sizes.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.muted,
  },
  filters: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: {
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.muted,
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
    borderRadius: radii.md,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    fontWeight: typography.weights.semibold,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
  },
  errorContainer: {
    padding: spacing.lg,
    backgroundColor: '#fff4f2',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#ffd6d1',
  },
  errorText: {
    color: colors.coral,
    fontSize: typography.sizes.sm,
  },
  errorHint: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  matchList: {
    gap: spacing.md,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 2,
  },
  matchWin: {
    borderColor: '#4caf50',
  },
  matchLoss: {
    borderColor: colors.coral,
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
    color: colors.muted,
  },
  rankedBadge: {
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
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
    borderRadius: radii.sm,
  },
  resultBadgeWin: {
    backgroundColor: '#e8f5e9',
  },
  resultBadgeLoss: {
    backgroundColor: '#fff4f2',
  },
  resultText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  resultTextWin: {
    color: '#4caf50',
  },
  resultTextLoss: {
    color: colors.coral,
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
    backgroundColor: colors.blue,
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
    color: colors.ink,
    flex: 1,
  },
  teamScore: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.muted,
  },
  teamScoreWin: {
    color: colors.ink,
  },
  vs: {
    fontSize: typography.sizes.xs,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: typography.weights.semibold,
  },
  matchDate: {
    fontSize: typography.sizes.xs,
    color: colors.muted,
    textAlign: 'center',
  },
});
