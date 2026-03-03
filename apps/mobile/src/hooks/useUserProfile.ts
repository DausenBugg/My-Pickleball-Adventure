import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import type { Profile, Rating } from './useProfile';

export interface UserAchievementSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface UserMatchHistoryItem {
  id: string;
  match_type: 'singles' | 'doubles';
  match_mode: 'casual' | 'ranked';
  winner_team: string;
  team_a_score: number;
  team_b_score: number;
  finalized_at: string;
  user_team: string;
  user_won: boolean;
  participants: {
    user_id: string;
    full_name: string | null;
    team: string;
  }[];
}

export function useUserProfile(userId: string | null) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [achievements, setAchievements] = useState<UserAchievementSummary[]>([]);
  const [matchHistory, setMatchHistory] = useState<UserMatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch profile, rating, achievements in parallel
      const [profileRes, ratingRes, achievementsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('ratings').select('*').eq('user_id', userId).single(),
        supabase
          .from('user_achievements')
          .select('earned_at, achievements(id, name, description, icon)')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);

      // Rating may not exist yet for new users
      if (!ratingRes.error) {
        setRating(ratingRes.data);
      }

      // Map achievements
      const mappedAchievements: UserAchievementSummary[] =
        (achievementsRes.data || [])
          .filter((row: any) => row.achievements)
          .map((row: any) => {
            const ach = row.achievements;
            return {
              id: ach.id,
              name: ach.name,
              description: ach.description,
              icon: ach.icon,
              earned_at: row.earned_at,
            };
          });
      setAchievements(mappedAchievements);

      // Fetch match history — get match IDs where this user is a participant
      const { data: participantRows } = await supabase
        .from('match_participants')
        .select('match_id, team')
        .eq('user_id', userId);

      if (participantRows && participantRows.length > 0) {
        const matchIds = participantRows.map((p) => p.match_id);
        const userTeamMap = new Map(participantRows.map((p) => [p.match_id, p.team]));

        const { data: matchesData } = await supabase
          .from('matches')
          .select('id, match_type, match_mode, winner_team, team_a_score, team_b_score, finalized_at')
          .in('id', matchIds)
          .eq('status', 'approved')
          .order('finalized_at', { ascending: false })
          .limit(10);

        if (matchesData) {
          // Fetch all participants for these matches
          const { data: allParticipants } = await supabase
            .from('match_participants')
            .select('match_id, user_id, team, profiles(full_name)')
            .in('match_id', matchesData.map((m) => m.id));

          const participantsByMatch = new Map<string, typeof allParticipants>();
          (allParticipants || []).forEach((p: any) => {
            const list = participantsByMatch.get(p.match_id) || [];
            list.push(p);
            participantsByMatch.set(p.match_id, list);
          });

          const mappedMatches: UserMatchHistoryItem[] = matchesData.map((match) => {
            const userTeam = userTeamMap.get(match.id) || 'team_a';
            const userWon = match.winner_team === userTeam;
            const matchParticipants = (participantsByMatch.get(match.id) || []).map((p: any) => ({
              user_id: p.user_id,
              full_name: p.profiles?.full_name || null,
              team: p.team,
            }));

            return {
              id: match.id,
              match_type: match.match_type,
              match_mode: match.match_mode,
              winner_team: match.winner_team,
              team_a_score: match.team_a_score,
              team_b_score: match.team_b_score,
              finalized_at: match.finalized_at,
              user_team: userTeam,
              user_won: userWon,
              participants: matchParticipants,
            };
          });

          setMatchHistory(mappedMatches);
        }
      } else {
        setMatchHistory([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
      if (__DEV__) console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  return {
    profile,
    rating,
    achievements,
    matchHistory,
    loading,
    error,
    refresh: fetchUserProfile,
  };
}
