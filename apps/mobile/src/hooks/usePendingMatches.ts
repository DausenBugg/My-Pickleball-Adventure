import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type PendingMatch = {
  id: string;
  submitter_id: string;
  match_type: 'singles' | 'doubles';
  match_mode: 'casual' | 'ranked';
  team_a_score: number;
  team_b_score: number;
  winner_team: 'team_a' | 'team_b';
  created_at: string;
  submitter_name: string | null;
  participants: {
    user_id: string;
    full_name: string | null;
    team: 'team_a' | 'team_b';
  }[];
  approvals: {
    user_id: string;
    approved: boolean;
  }[];
};

export function usePendingMatches() {
  const { session, isAuthTransitioning } = useAuth();
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
      // Get matches where user is a participant and status is pending
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

      // Get match details for pending matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(
          `
          id,
          submitter_id,
          match_type,
          match_mode,
          team_a_score,
          team_b_score,
          winner_team,
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

      // Batch fetch all participants and approvals (fixes N+1 query)
      const pendingMatchIds = matchesData.map((m: any) => m.id);
      
      // Fetch all participants for all pending matches in one query
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

      // Fetch all approvals for all pending matches in one query
      const { data: allApprovals } = await supabase
        .from('match_approvals')
        .select('match_id, user_id, approved')
        .in('match_id', pendingMatchIds);

      // Group participants by match_id
      const participantsByMatch = new Map<string, any[]>();
      (allParticipants || []).forEach((p: any) => {
        const existing = participantsByMatch.get(p.match_id) || [];
        existing.push(p);
        participantsByMatch.set(p.match_id, existing);
      });

      // Group approvals by match_id
      const approvalsByMatch = new Map<string, any[]>();
      (allApprovals || []).forEach((a: any) => {
        const existing = approvalsByMatch.get(a.match_id) || [];
        existing.push(a);
        approvalsByMatch.set(a.match_id, existing);
      });

      // Enrich matches with pre-fetched data
      const enrichedMatches = matchesData.map((match: any) => {
        const participants = participantsByMatch.get(match.id) || [];
        const approvals = approvalsByMatch.get(match.id) || [];

        return {
          id: match.id,
          submitter_id: match.submitter_id,
          match_type: match.match_type,
          match_mode: match.match_mode,
          team_a_score: match.team_a_score,
          team_b_score: match.team_b_score,
          winner_team: match.winner_team,
          created_at: match.created_at,
          submitter_name: match.submitter?.full_name || null,
          participants: participants.map((p: any) => ({
            user_id: p.user_id,
            full_name: p.profiles?.full_name || null,
            team: p.team,
          })),
          approvals: approvals.map((a: any) => ({
            user_id: a.user_id,
            approved: a.approved,
          })),
        };
      });

      setMatches(enrichedMatches.filter((m): m is PendingMatch => m !== null));
    } catch (err: any) {
      setError(err.message || 'Failed to load pending matches');
      console.error('Error fetching pending matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [session?.user?.id]);

  const processMatchApproval = async (matchId: string, expectedUserId: string) => {
    if (!supabase) return false;

    const jwtErrorRegex = /invalid jwt|jwt|token|auth|unauthorized|401/i;

    const getLiveSessionForUser = async () => {
      const { data: liveData } = await supabase.auth.getSession();
      const liveSession = liveData?.session;

      if (!liveSession?.access_token || !liveSession?.user?.id) {
        return { ok: false as const, message: 'Session expired. Please sign out and sign back in.' };
      }

      if (liveSession.user.id !== expectedUserId) {
        return {
          ok: false as const,
          message: 'Auth state changed. Please wait a moment and try again.',
        };
      }

      return { ok: true as const, token: liveSession.access_token };
    };

    const invokeWithDetails = async (accessToken: string) => {
      const { error: invokeError } = await supabase.functions.invoke('process-match-approval', {
        body: { matchId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!invokeError) {
        return { ok: true, message: '' };
      }

      let detailedMessage = invokeError.message || '';
      const contextResponse: any = (invokeError as any).context;
      if (contextResponse) {
        try {
          const errorPayload = await contextResponse.json();
          if (errorPayload?.error) detailedMessage = errorPayload.error;
          else if (errorPayload?.message) detailedMessage = errorPayload.message;
        } catch {
          try {
            const text = await contextResponse.text();
            if (text) detailedMessage = text;
          } catch {
            // keep original detailedMessage
          }
        }
      }

      return { ok: false, message: detailedMessage || 'Failed to process match approval' };
    };

    const liveSessionResult = await getLiveSessionForUser();
    if (!liveSessionResult.ok) {
      setError(liveSessionResult.message);
      return false;
    }

    let result = await invokeWithDetails(liveSessionResult.token);

    if (!result.ok && jwtErrorRegex.test(result.message)) {
      const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
      const refreshedSession = refreshedData?.session;

      if (
        refreshError ||
        !refreshedSession?.access_token ||
        !refreshedSession?.user?.id ||
        refreshedSession.user.id !== expectedUserId
      ) {
        setError('Session expired. Please sign out and sign back in.');
        return false;
      }

      result = await invokeWithDetails(refreshedSession.access_token);
    }

    if (!result.ok) {
      if (jwtErrorRegex.test(result.message)) {
        setError('Session expired. Please sign out and sign back in.');
      } else {
        setError(result.message);
      }
      if (__DEV__) console.error('process-match-approval failed:', result.message);
      return false;
    }

    return true;
  };

  const approveMatch = async (matchId: string) => {
    if (!session?.user?.id || !supabase) return false;
    if (isAuthTransitioning) {
      setError('Auth state is updating. Please try again in a moment.');
      return false;
    }

    const expectedUserId = session.user.id;

    const { data: liveData } = await supabase.auth.getSession();
    const liveSession = liveData?.session;
    if (!liveSession?.user?.id || liveSession.user.id !== expectedUserId) {
      setError('Auth state changed. Please wait a moment and try again.');
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('match_approvals')
        .upsert(
          {
            match_id: matchId,
            user_id: expectedUserId,
            approved: true,
          },
          {
            onConflict: 'match_id,user_id',
          }
        );

      if (insertError) {
        throw insertError;
      }

      const processed = await processMatchApproval(matchId, expectedUserId);

      if (!processed) {
        await supabase
          .from('match_approvals')
          .delete()
          .eq('match_id', matchId)
          .eq('user_id', expectedUserId);
      }

      // Refresh matches
      await fetchMatches();
      return processed;
    } catch (err) {
      console.error('Failed to approve match:', err);
      return false;
    }
  };

  const rejectMatch = async (matchId: string) => {
    if (!session?.user?.id || !supabase) return false;
    if (isAuthTransitioning) {
      setError('Auth state is updating. Please try again in a moment.');
      return false;
    }

    const expectedUserId = session.user.id;

    const { data: liveData } = await supabase.auth.getSession();
    const liveSession = liveData?.session;
    if (!liveSession?.user?.id || liveSession.user.id !== expectedUserId) {
      setError('Auth state changed. Please wait a moment and try again.');
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('match_approvals')
        .upsert(
          {
            match_id: matchId,
            user_id: expectedUserId,
            approved: false,
          },
          {
            onConflict: 'match_id,user_id',
          }
        );

      if (insertError) throw insertError;

      const processed = await processMatchApproval(matchId, expectedUserId);

      if (!processed) {
        await supabase
          .from('match_approvals')
          .delete()
          .eq('match_id', matchId)
          .eq('user_id', expectedUserId);
      }

      // Refresh matches
      await fetchMatches();
      return processed;
    } catch (err) {
      console.error('Failed to reject match:', err);
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
