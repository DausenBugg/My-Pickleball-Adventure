import { useEffect, useState } from 'react';

import { supabase, supabaseUrl } from '../lib/supabase';
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
  const { session } = useAuth();
  const [matches, setMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!session?.user?.id || !supabase) {
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

  const approveMatch = async (matchId: string) => {
    if (!session?.user?.id || !supabase) return false;

    try {
      const { error: insertError } = await supabase
        .from('match_approvals')
        .insert({
          match_id: matchId,
          user_id: session.user.id,
          approved: true,
        });

      if (insertError) {
        throw insertError;
      }

      // Call Edge Function to process match approval
      if (!supabaseUrl || !supabase) {
        console.error('Supabase not configured for edge function calls');
        return false;
      }

      // Get the user's access token for authenticated edge function call
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        console.error('No valid session for edge function call');
        return false;
      }

      console.log('Calling process-match-approval for match:', matchId);
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      const approvalResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-match-approval`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify({ matchId }),
        }
      );

      if (!approvalResponse.ok) {
        const errorText = await approvalResponse.text();
        console.error('process-match-approval failed:', errorText);
      } else {
        const responseData = await approvalResponse.json();
        console.log('process-match-approval succeeded:', responseData);
      }

      // Refresh matches
      await fetchMatches();
      return true;
    } catch (err) {
      console.error('Failed to approve match:', err);
      return false;
    }
  };

  const rejectMatch = async (matchId: string) => {
    if (!session?.user?.id || !supabase) return false;

    try {
      const { error: insertError } = await supabase
        .from('match_approvals')
        .insert({
          match_id: matchId,
          user_id: session.user.id,
          approved: false,
        });

      if (insertError) throw insertError;

      // Call Edge Function to process rejection (update status)
      if (!supabaseUrl || !supabase) {
        console.error('Supabase not configured for edge function calls');
        return false;
      }

      // Get the user's access token for authenticated edge function call
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        console.error('No valid session for edge function call');
        return false;
      }

      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      const rejectionResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-match-approval`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify({ matchId }),
        }
      );

      if (!rejectionResponse.ok) {
        const errorText = await rejectionResponse.text();
        console.error('process-match-approval failed:', errorText);
      }

      // Refresh matches
      await fetchMatches();
      return true;
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
