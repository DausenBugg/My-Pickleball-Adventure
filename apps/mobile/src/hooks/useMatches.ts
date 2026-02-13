import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type Match = {
  id: string;
  match_type: 'singles' | 'doubles';
  is_ranked: boolean;
  winning_team: 1 | 2;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  team1_player1: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  team1_player2?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  team2_player1: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  team2_player2?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  score_team1: number;
  score_team2: number;
};

export type MatchFilters = {
  matchType?: 'singles' | 'doubles' | 'all';
  isRanked?: boolean | 'all';
  result?: 'wins' | 'losses' | 'all';
  status?: 'pending' | 'approved' | 'rejected' | 'all';
};

export function useMatches(filters: MatchFilters = {}) {
  const { session } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      if (!supabase) return;

      setLoading(true);
      setError(null);

      try {
        // Get all match IDs the user participated in
        const { data: participants, error: participantsError } = await supabase
          .from('match_participants')
          .select('match_id')
          .eq('player_id', session.user.id);

        if (participantsError) throw participantsError;
        if (!participants || participants.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }

        const matchIds = participants.map((p) => p.match_id);

        // Fetch full match details
        let query = supabase
          .from('matches')
          .select(
            `
            id,
            match_type,
            is_ranked,
            winning_team,
            status,
            score_team1,
            score_team2,
            created_at
          `
          )
          .in('id', matchIds)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.matchType && filters.matchType !== 'all') {
          query = query.eq('match_type', filters.matchType);
        }
        if (filters.isRanked !== undefined && filters.isRanked !== 'all') {
          query = query.eq('is_ranked', filters.isRanked);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data: matchesData, error: matchesError } = await query;

        if (matchesError) throw matchesError;

        // Enrich with player data
        const enrichedMatches = await Promise.all(
          matchesData.map(async (match) => {
            const { data: parts } = await supabase
              .from('match_participants')
              .select(
                `
                player_id,
                team,
                profiles!inner (
                  id,
                  full_name,
                  avatar_url
                )
              `
              )
              .eq('match_id', match.id);

            const team1 = parts?.filter((p) => p.team === 1) || [];
            const team2 = parts?.filter((p) => p.team === 2) || [];

            return {
              ...match,
              team1_player1: team1[0]?.profiles,
              team1_player2: team1[1]?.profiles,
              team2_player1: team2[0]?.profiles,
              team2_player2: team2[1]?.profiles,
            };
          })
        );

        // Filter by result if needed
        let finalMatches = enrichedMatches;
        if (filters.result && filters.result !== 'all') {
          finalMatches = enrichedMatches.filter((match) => {
            const team1Ids = [
              match.team1_player1?.id,
              match.team1_player2?.id,
            ].filter(Boolean);
            const team2Ids = [
              match.team2_player1?.id,
              match.team2_player2?.id,
            ].filter(Boolean);

            const userInTeam1 = team1Ids.includes(session.user.id);
            const userInTeam2 = team2Ids.includes(session.user.id);

            const userWon =
              (userInTeam1 && match.winning_team === 1) ||
              (userInTeam2 && match.winning_team === 2);

            return filters.result === 'wins' ? userWon : !userWon;
          });
        }

        setMatches(finalMatches as Match[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [
    session?.user?.id,
    filters.matchType,
    filters.isRanked,
    filters.result,
    filters.status,
  ]);

  return { matches, loading, error };
}
