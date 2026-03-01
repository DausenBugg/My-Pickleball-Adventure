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
      const message = 'Not authenticated';
      setError(message);
      return { data: null, error: message };
    }

    setLoading(true);
    setError(null);
    // Intentionally no verbose logging in production paths.

    try {
      // Determine winner
      const winnerTeam = data.teamAScore > data.teamBScore ? 'team_a' : 'team_b';

      // 1. Create the match (via RPC to avoid RLS insert issues)
      const { data: matchId, error: matchError } = await supabase.rpc(
        'insert_match',
        {
          p_match_type: data.matchType,
          p_match_mode: data.matchMode,
          p_team_a_score: data.teamAScore,
          p_team_b_score: data.teamBScore,
          p_winner_team: winnerTeam,
        }
      );

      if (matchError || !matchId) {
        const message = matchError?.message || 'Failed to create match';
        setError(message);
        setLoading(false);
        return { data: null, error: message };
      }

      // 2. Add all participants
      const participantsData = data.participants.map((p) => ({
        match_id: matchId,
        user_id: p.userId,
        team: p.team,
        result: p.team === winnerTeam ? 'win' : 'loss',
      }));

      const { error: participantsError } = await supabase
        .from('match_participants')
        .insert(participantsData);

      if (participantsError) {
        const message = participantsError.message;
        setError(message);
        setLoading(false);
        return { data: null, error: message };
      }

      const recipientIds = Array.from(
        new Set(participantsData.map((participant) => participant.user_id))
      ).filter((id) => id !== session.user.id);

      if (recipientIds.length > 0) {
        const notifications = recipientIds.map((userId) => ({
          user_id: userId,
          type: 'match_approval',
          title: 'Match awaiting approval',
          message: 'You were added to a match. Review and approve it.',
          data: { match_id: matchId },
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError && __DEV__) {
          console.error('Failed to create match notifications:', notificationError);
        }
      }

      // 3. Add submitter's approval automatically
      const { error: approvalError } = await supabase
        .from('match_approvals')
        .insert({
          match_id: matchId,
          user_id: session.user.id,
          approved: true,
        });

      if (approvalError && __DEV__) {
        // Non-critical error - match is created, just approval failed
        console.warn('Failed to add submitter approval:', approvalError);
      }

      setLoading(false);
      return { data: { id: matchId }, error: null };
    } catch (err) {
      if (__DEV__) console.error('Submit match error:', err);
      const message = 'An unexpected error occurred';
      setError(message);
      setLoading(false);
      return { data: null, error: message };
    }
  };

  return { submitMatch, loading, error };
}
