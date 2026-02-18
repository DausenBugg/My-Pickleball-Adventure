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

  const refresh = async () => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all match IDs the user participated in
      const { data: participants, error: participantsError } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id);

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
          match_mode,
          winner_team,
          status,
          team_a_score,
          team_b_score,
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
        query = query.eq('match_mode', filters.isRanked ? 'ranked' : 'casual');
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: matchesData, error: matchesError } = await query;

      if (matchesError) throw matchesError;

      // Batch fetch all participants for all matches (fixes N+1 query)
      const filteredMatchIds = matchesData.map((m) => m.id);
      const { data: allParticipants, error: partsError } = await supabase
        .from('match_participants')
        .select(
          `
          match_id,
          user_id,
          team,
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .in('match_id', filteredMatchIds);

      if (partsError) {
        console.error('Error fetching participants:', partsError);
      }

      // Group participants by match_id for efficient lookup
      const participantsByMatch = new Map<string, any[]>();
      (allParticipants || []).forEach((p) => {
        const existing = participantsByMatch.get(p.match_id) || [];
        existing.push(p);
        participantsByMatch.set(p.match_id, existing);
      });

      // Enrich matches with pre-fetched participant data
      const enrichedMatches = matchesData.map((match) => {
        const parts = participantsByMatch.get(match.id) || [];
        const team1 = parts.filter((p) => p.team === 'team_a');
        const team2 = parts.filter((p) => p.team === 'team_b');

        // Validate that we have at least one player per team
        if (team1.length === 0 || team2.length === 0) {
          console.warn('Match missing team data:', match.id);
          return null;
        }

        // Create safe player objects with fallbacks
        const createPlayerObject = (part: any) => ({
          id: part?.profiles?.id || part?.user_id || '',
          full_name: part?.profiles?.full_name || 'Unknown Player',
          avatar_url: part?.profiles?.avatar_url || null,
        });

        return {
          id: match.id,
          match_type: match.match_type,
          is_ranked: match.match_mode === 'ranked',
          winning_team: match.winner_team === 'team_a' ? 1 : 2,
          status: match.status,
          score_team1: match.team_a_score ?? 0,
          score_team2: match.team_b_score ?? 0,
          created_at: match.created_at,
          team1_player1: team1[0] ? createPlayerObject(team1[0]) : null,
          team1_player2: team1[1] ? createPlayerObject(team1[1]) : undefined,
          team2_player1: team2[0] ? createPlayerObject(team2[0]) : null,
          team2_player2: team2[1] ? createPlayerObject(team2[1]) : undefined,
        };
      });

      // Filter out null matches (errors during enrichment)
      const validMatches = enrichedMatches.filter((m) => m !== null);

      // Filter by result if needed
      let finalMatches = validMatches;
      if (filters.result && filters.result !== 'all') {
        finalMatches = validMatches.filter((match) => {
          if (!match) return false;
          
          const team1Ids = [
            match.team1_player1?.id,
            match.team1_player2?.id,
          ].filter(Boolean) as string[];
          const team2Ids = [
            match.team2_player1?.id,
            match.team2_player2?.id,
          ].filter(Boolean) as string[];

          // Check if user is in any team
          const userInTeam1 = team1Ids.includes(session.user.id);
          const userInTeam2 = team2Ids.includes(session.user.id);
          
          // User should be in exactly one team
          if (!userInTeam1 && !userInTeam2) {
            console.warn('User not in any team for match:', match.id);
            return false;
          }

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

  useEffect(() => {
    refresh();
  }, [
    session?.user?.id,
    filters.matchType,
    filters.isRanked,
    filters.result,
    filters.status,
  ]);

  return { matches, loading, error, refresh };
}
