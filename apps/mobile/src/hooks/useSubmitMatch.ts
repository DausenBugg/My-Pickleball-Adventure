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
      console.error('Submit match blocked: no session user id');
      return null;
    }

    setLoading(true);
    setError(null);
    console.log('Submitting match payload:', data);
    console.log('Submit match session user id:', session.user.id);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn('Submit match getUser error:', userError);
      } else {
        console.log('Submit match getUser id:', userData.user?.id || 'none');
      }
    } catch (userError) {
      console.warn('Submit match getUser exception:', userError);
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Submit match session id:', sessionData.session?.user?.id || 'none');
    } catch (sessionError) {
      console.warn('Unable to read session before submit:', sessionError);
    }

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
        console.error('Match insert failed:', matchError);
        setError(matchError?.message || 'Failed to create match');
        setLoading(false);
        return null;
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
        console.error('Participants insert failed:', participantsError);
        setError(participantsError.message);
        setLoading(false);
        return null;
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

        if (notificationError) {
          console.error('Failed to create match notifications:', notificationError);
        }
        console.log('Match notifications inserted:', recipientIds);
      }

      // 3. Add submitter's approval automatically
      const { error: approvalError } = await supabase
        .from('match_approvals')
        .insert({
          match_id: matchId,
          user_id: session.user.id,
          approved: true,
        });

      if (approvalError) {
        // Non-critical error - match is created, just approval failed
        console.warn('Failed to add submitter approval:', approvalError);
      }

      setLoading(false);
      console.log('Match submitted:', matchId);
      return { id: matchId } as { id: string };
    } catch (err) {
      console.error('Submit match error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
      return null;
    }
  };

  return { submitMatch, loading, error };
}
