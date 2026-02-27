import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { recordTelemetry } from '../lib/telemetry';
import { useAuth } from '../state/auth';

export type PendingMatch = {
  id: string;
  match_type: 'singles' | 'doubles';
  match_mode: 'casual' | 'ranked';
  team_a_score: number;
  team_b_score: number;
  created_at: string;
  submitter_name: string | null;
  participants: {
    user_id: string;
    full_name: string | null;
    team: 'team_a' | 'team_b';
  }[];
};

export function usePendingMatches() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!session?.user?.id || !supabase) {
      setMatches([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: participantMatches, error: matchError } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id);

      if (matchError) throw matchError;

      if (!participantMatches || participantMatches.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const matchIds = participantMatches.map((p) => p.match_id);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(
          `
          id,
          match_type,
          match_mode,
          team_a_score,
          team_b_score,
          created_at,
          submitter:profiles!matches_submitter_id_fkey(full_name)
        `
        )
        .in('id', matchIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const pendingMatchIds = matchesData.map((m: any) => m.id);

      const { data: allParticipants } = await supabase
        .from('match_participants')
        .select(
          `
          match_id,
          user_id,
          team,
          profiles(full_name)
        `
        )
        .in('match_id', pendingMatchIds);

      const participantsByMatch = new Map<string, any[]>();
      (allParticipants || []).forEach((p: any) => {
        const existing = participantsByMatch.get(p.match_id) || [];
        existing.push(p);
        participantsByMatch.set(p.match_id, existing);
      });

      const enrichedMatches: PendingMatch[] = matchesData.map((match: any) => ({
        id: match.id,
        match_type: match.match_type,
        match_mode: match.match_mode,
        team_a_score: match.team_a_score,
        team_b_score: match.team_b_score,
        created_at: match.created_at,
        submitter_name: match.submitter?.full_name || null,
        participants: (participantsByMatch.get(match.id) || []).map((p: any) => ({
          user_id: p.user_id,
          full_name: p.profiles?.full_name || null,
          team: p.team,
        })),
      }));

      setMatches(enrichedMatches);
    } catch (err: any) {
      const message = err.message || 'Failed to load pending matches';
      setError(message);
      recordTelemetry('pending_matches_fetch_failed', { message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [session?.user?.id]);

  const processMatchApproval = async (matchId: string) => {
    if (!supabase) {
      recordTelemetry('pending_matches_process_missing_supabase', { matchId });
      return false;
    }

    const { error: invokeError } = await supabase.functions.invoke('process-match-approval', {
      body: { matchId },
    });

    if (invokeError) {
      const message = invokeError.message || 'Failed to process approval';
      setError(message);
      recordTelemetry('pending_matches_process_failed', { matchId, message });
      return false;
    }

    return true;
  };

  const approveMatch = async (matchId: string) => {
    if (!session?.user?.id || !supabase) return false;

    try {
      const { error: insertError } = await supabase.from('match_approvals').upsert(
        {
          match_id: matchId,
          user_id: session.user.id,
          approved: true,
        },
        {
          onConflict: 'match_id,user_id',
        }
      );

      if (insertError) throw insertError;

      const processed = await processMatchApproval(matchId);
      await fetchMatches();
      return processed;
    } catch (err: any) {
      recordTelemetry('pending_matches_approve_failed', {
        matchId,
        message: err?.message ?? 'unknown',
      });
      return false;
    }
  };

  const rejectMatch = async (matchId: string) => {
    if (!session?.user?.id || !supabase) return false;

    try {
      const { error: insertError } = await supabase.from('match_approvals').upsert(
        {
          match_id: matchId,
          user_id: session.user.id,
          approved: false,
        },
        {
          onConflict: 'match_id,user_id',
        }
      );

      if (insertError) throw insertError;

      const processed = await processMatchApproval(matchId);
      await fetchMatches();
      return processed;
    } catch (err: any) {
      recordTelemetry('pending_matches_reject_failed', {
        matchId,
        message: err?.message ?? 'unknown',
      });
      return false;
    }
  };

  return {
    matches,
    loading,
    error,
    approveMatch,
    rejectMatch,
    refresh: fetchMatches,
  };
}