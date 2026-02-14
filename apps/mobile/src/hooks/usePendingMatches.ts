import { useEffect, useState } from 'react';

import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';
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

      // For each match, get participants and approvals
      const enrichedMatches = await Promise.all(
        matchesData.map(async (match: any) => {
          if (!supabase) return null;
          
          // Get participants
          const { data: participants } = await supabase
            .from('match_participants')
            .select(
              `
              user_id,
              team,
              profiles(full_name)
            `
            )
            .eq('match_id', match.id);

          // Get approvals
          const { data: approvals } = await supabase
            .from('match_approvals')
            .select('user_id, approved')
            .eq('match_id', match.id);

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
            participants:
              participants?.map((p: any) => ({
                user_id: p.user_id,
                full_name: p.profiles?.full_name || null,
                team: p.team,
              })) || [],
            approvals:
              approvals?.map((a) => ({
                user_id: a.user_id,
                approved: a.approved,
              })) || [],
          };
        })
      );

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
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        console.error('Missing access token for approval invoke');
        return false;
      }

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase not configured for edge function calls');
        return false;
      }

      console.log('Calling process-match-approval for match:', matchId);
      const approvalResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-match-approval`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
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
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return false;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase not configured for edge function calls');
        return false;
      }

      const rejectionResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-match-approval`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
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
