import { useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type MatchParticipant = {
  userId: string;
  team: 'team_a' | 'team_b';
};

export type SubmitMatchData = {
  matchType: 'singles' | 'doubles';
  matchMode: 'casual' | 'ranked';
  teamAScore: number;
  teamBScore: number;
  participants: MatchParticipant[];
};

export function useSubmitMatch() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMatch = async (data: SubmitMatchData) => {
    if (!session?.user?.id || !supabase) {
      setError('Not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine winner
      const winnerTeam = data.teamAScore > data.teamBScore ? 'team_a' : 'team_b';

      // 1. Create the match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          submitter_id: session.user.id,
          match_type: data.matchType,
          match_mode: data.matchMode,
          team_a_score: data.teamAScore,
          team_b_score: data.teamBScore,
          winner_team: winnerTeam,
          status: 'pending',
        })
        .select()
        .single();

      if (matchError || !match) {
        setError(matchError?.message || 'Failed to create match');
        setLoading(false);
        return null;
      }

      // 2. Add all participants
      const participantsData = data.participants.map((p) => ({
        match_id: match.id,
        user_id: p.userId,
        team: p.team,
        result: p.team === winnerTeam ? 'win' : 'loss',
      }));

      const { error: participantsError } = await supabase
        .from('match_participants')
        .insert(participantsData);

      if (participantsError) {
        setError(participantsError.message);
        setLoading(false);
        return null;
      }

      // 3. Add submitter's approval automatically
      const { error: approvalError } = await supabase
        .from('match_approvals')
        .insert({
          match_id: match.id,
          user_id: session.user.id,
          approved: true,
        });

      if (approvalError) {
        // Non-critical error - match is created, just approval failed
        console.warn('Failed to add submitter approval:', approvalError);
      }

      setLoading(false);
      return match;
    } catch (err) {
      console.error('Submit match error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
      return null;
    }
  };

  return { submitMatch, loading, error };
}
