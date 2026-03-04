import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export interface MatchDetailPlayer {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
  team: 'team_a' | 'team_b';
}

export interface MatchApproval {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  approved: boolean | null; // null = pending
}

export interface RatingChange {
  user_id: string;
  full_name: string | null;
  old_rating: number;
  new_rating: number;
  rating_change: number;
}

export interface XPEvent {
  user_id: string;
  full_name: string | null;
  xp_amount: number;
  reason: string;
}

export interface MatchDetail {
  id: string;
  match_type: 'singles' | 'doubles';
  match_mode: 'casual' | 'ranked';
  status: 'pending' | 'approved' | 'rejected';
  team_a_score: number;
  team_b_score: number;
  winner_team: string;
  created_at: string;
  finalized_at: string | null;
  submitter_id: string;
  players: MatchDetailPlayer[];
  approvals: MatchApproval[];
  ratingChanges: RatingChange[];
  xpEvents: XPEvent[];
}

export function useMatchDetail(matchId: string | null) {
  const { session } = useAuth();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!matchId || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch match, participants, approvals in parallel
      const [matchRes, participantsRes, approvalsRes, ratingRes, xpRes] =
        await Promise.all([
          supabase
            .from('matches')
            .select(
              'id, match_type, match_mode, status, team_a_score, team_b_score, winner_team, created_at, finalized_at, submitter_id'
            )
            .eq('id', matchId)
            .single(),
          supabase
            .from('match_participants')
            .select(
              `
              user_id,
              team,
              profiles!inner (
                id,
                full_name,
                avatar_url,
                level
              )
            `
            )
            .eq('match_id', matchId),
          supabase
            .from('match_approvals')
            .select(
              `
              user_id,
              approved,
              profiles!inner (
                full_name,
                avatar_url
              )
            `
            )
            .eq('match_id', matchId),
          supabase
            .from('rating_history')
            .select('user_id, old_rating, new_rating, rating_change')
            .eq('match_id', matchId),
          supabase
            .from('xp_events')
            .select('user_id, xp_amount, reason')
            .eq('match_id', matchId),
        ]);

      if (matchRes.error) throw matchRes.error;

      // Build players array
      const players: MatchDetailPlayer[] = (participantsRes.data || []).map(
        (p: any) => ({
          id: p.profiles?.id || p.user_id,
          full_name: p.profiles?.full_name || null,
          avatar_url: p.profiles?.avatar_url || null,
          level: p.profiles?.level ?? 1,
          team: p.team,
        })
      );

      // Build approvals array
      const approvals: MatchApproval[] = (approvalsRes.data || []).map(
        (a: any) => ({
          user_id: a.user_id,
          full_name: a.profiles?.full_name || null,
          avatar_url: a.profiles?.avatar_url || null,
          approved: a.approved,
        })
      );

      // For players who haven't voted yet, add them as pending
      const approvalUserIds = new Set(approvals.map((a) => a.user_id));
      players.forEach((p) => {
        if (!approvalUserIds.has(p.id)) {
          approvals.push({
            user_id: p.id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            approved: null,
          });
        }
      });

      // Build profile name lookup from players
      const nameMap = new Map(players.map((p) => [p.id, p.full_name]));

      // Build rating changes
      const ratingChanges: RatingChange[] = (ratingRes.data || []).map(
        (r: any) => ({
          user_id: r.user_id,
          full_name: nameMap.get(r.user_id) || null,
          old_rating: r.old_rating,
          new_rating: r.new_rating,
          rating_change: r.rating_change,
        })
      );

      // Build XP events — aggregate by user
      const xpByUser = new Map<string, { total: number; reasons: string[] }>();
      (xpRes.data || []).forEach((x: any) => {
        const existing = xpByUser.get(x.user_id) || {
          total: 0,
          reasons: [],
        };
        existing.total += x.xp_amount;
        existing.reasons.push(
          `+${x.xp_amount} ${x.reason || 'XP'}`
        );
        xpByUser.set(x.user_id, existing);
      });

      const xpEvents: XPEvent[] = Array.from(xpByUser.entries()).map(
        ([userId, data]) => ({
          user_id: userId,
          full_name: nameMap.get(userId) || null,
          xp_amount: data.total,
          reason: data.reasons.join(', '),
        })
      );

      setMatch({
        id: matchRes.data.id,
        match_type: matchRes.data.match_type,
        match_mode: matchRes.data.match_mode,
        status: matchRes.data.status,
        team_a_score: matchRes.data.team_a_score,
        team_b_score: matchRes.data.team_b_score,
        winner_team: matchRes.data.winner_team,
        created_at: matchRes.data.created_at,
        finalized_at: matchRes.data.finalized_at,
        submitter_id: matchRes.data.submitter_id,
        players,
        approvals,
        ratingChanges,
        xpEvents,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load match details');
      if (__DEV__) console.error('Error fetching match detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [matchId]);

  return { match, loading, error, refresh };
}
