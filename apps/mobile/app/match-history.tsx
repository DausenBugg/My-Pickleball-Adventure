import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useMatches, MatchFilters } from '../src/hooks/useMatches';
import { useAuth } from '../src/state/auth';
import { AppScreen, Avatar, EmptyState, GlassCard, GradientHeader, SegmentedControl } from '../src/components/ui';
import { useAppTheme } from '../src/theme';

export default function MatchHistoryScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [filters, setFilters] = useState<MatchFilters>({
    matchType: 'all',
    isRanked: 'all',
    result: 'all',
    status: 'approved',
  });

  const { matches, loading, error } = useMatches(filters);

  return (
    <AppScreen contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 60 }}>
      <GradientHeader
        title="Match History"
        subtitle="Your complete match record with filters."
        right={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.color.role.border,
              backgroundColor: theme.color.role.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.color.role.textPrimary} />
          </Pressable>
        }
      />

      <GlassCard style={{ gap: theme.spacing.sm }}>
        <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }}>
          Filter by type
        </Text>
        <SegmentedControl
          value={filters.matchType || 'all'}
          onChange={(value) => setFilters({ ...filters, matchType: value })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'singles', label: 'Singles' },
            { value: 'doubles', label: 'Doubles' },
          ]}
        />
        <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }}>
          Filter by mode
        </Text>
        <SegmentedControl
          value={filters.isRanked === 'all' ? 'all' : filters.isRanked ? 'ranked' : 'casual'}
          onChange={(value) =>
            setFilters({
              ...filters,
              isRanked: value === 'all' ? 'all' : value === 'ranked',
            })
          }
          options={[
            { value: 'all', label: 'All' },
            { value: 'ranked', label: 'Ranked' },
            { value: 'casual', label: 'Casual' },
          ]}
        />
        <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }}>
          Filter by result
        </Text>
        <SegmentedControl
          value={filters.result || 'all'}
          onChange={(value) => setFilters({ ...filters, result: value })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'wins', label: 'Wins' },
            { value: 'losses', label: 'Losses' },
          ]}
        />
      </GlassCard>

      {loading ? (
        <GlassCard style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <ActivityIndicator size="large" color={theme.color.role.primary} />
          <Text style={{ marginTop: theme.spacing.sm, color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>
            Loading matches...
          </Text>
        </GlassCard>
      ) : error ? (
        <EmptyState
          title={error.includes('does not exist') && error.includes('match_participants') ? 'No matches logged yet' : 'Unable to load matches'}
          subtitle={
            error.includes('does not exist') && error.includes('match_participants')
              ? 'Play your first match to start tracking history.'
              : error
          }
          icon="alert-circle-outline"
        />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No matches found"
          subtitle="Try adjusting filters or play a new match."
          icon="tennisball-outline"
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {matches.map((match) => {
            if (!match || !match.team1_player1 || !match.team2_player1) return null;

            const team1Ids = [match.team1_player1?.id, match.team1_player2?.id].filter(Boolean);
            const userInTeam1 = team1Ids.includes(session?.user?.id || '');
            const userWon = (userInTeam1 && match.winning_team === 1) || (!userInTeam1 && match.winning_team === 2);

            return (
              <GlassCard
                key={match.id}
                style={{
                  borderColor: userWon ? theme.color.role.success : theme.color.role.secondary,
                  borderWidth: 2,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }}>
                      {match.match_type === 'singles' ? '1v1' : '2v2'}
                    </Text>
                    {match.is_ranked ? (
                      <View
                        style={{
                          borderRadius: theme.radius.sm,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          backgroundColor: theme.color.role.primarySoft,
                        }}
                      >
                        <Text style={{ color: theme.color.role.primary, fontFamily: theme.type.family.bodySemi, fontSize: theme.type.sizes.xs }}>
                          RANKED
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View
                    style={{
                      borderRadius: theme.radius.pill,
                      backgroundColor: userWon ? theme.color.role.successSoft : theme.color.role.secondarySoft,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: userWon ? theme.color.role.success : theme.color.role.secondary,
                        fontFamily: theme.type.family.bodySemi,
                        fontSize: theme.type.sizes.sm,
                      }}
                    >
                      {userWon ? 'WIN' : 'LOSS'}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Avatar uri={match.team1_player1.avatar_url} name={match.team1_player1.full_name || 'Player'} size={24} />
                      <Text numberOfLines={1} style={{ flex: 1, color: theme.color.role.textPrimary, fontFamily: theme.type.family.body }}>
                        {match.team1_player1.full_name || 'Player'}
                        {match.team1_player2 ? ` & ${match.team1_player2.full_name || 'Player'}` : ''}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: match.winning_team === 1 ? theme.color.role.textPrimary : theme.color.role.textMuted,
                        fontFamily: theme.type.family.headingSemi,
                        fontSize: theme.type.sizes.lg,
                      }}
                    >
                      {match.score_team1}
                    </Text>
                  </View>
                  <Text style={{ textAlign: 'center', color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.xs }}>
                    VS
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Avatar uri={match.team2_player1.avatar_url} name={match.team2_player1.full_name || 'Player'} size={24} />
                      <Text numberOfLines={1} style={{ flex: 1, color: theme.color.role.textPrimary, fontFamily: theme.type.family.body }}>
                        {match.team2_player1.full_name || 'Player'}
                        {match.team2_player2 ? ` & ${match.team2_player2.full_name || 'Player'}` : ''}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: match.winning_team === 2 ? theme.color.role.textPrimary : theme.color.role.textMuted,
                        fontFamily: theme.type.family.headingSemi,
                        fontSize: theme.type.sizes.lg,
                      }}
                    >
                      {match.score_team2}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    marginTop: theme.spacing.sm,
                    textAlign: 'center',
                    color: theme.color.role.textMuted,
                    fontFamily: theme.type.family.body,
                    fontSize: theme.type.sizes.xs,
                  }}
                >
                  {new Date(match.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </GlassCard>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
