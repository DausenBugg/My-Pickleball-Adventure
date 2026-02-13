import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { useFriends } from './useFriends';

export type LeaderboardEntry = {
  id: string;
  user_id: string;
  rating: number;
  games_played: number;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
  wins: number;
  losses: number;
};

export function useLeaderboard(type: 'global' | 'friends') {
  const { session } = useAuth();
  const { friends } = useFriends();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      if (!supabase) return;

      let query = supabase
        .from('ratings')
        .select(
          `
          id,
          user_id,
          rating,
          games_played,
          profiles (
            full_name,
            avatar_url,
            level,
            wins,
            losses
          )
        `
        )
        .order('rating', { ascending: false })
        .limit(50);

      if (type === 'friends' && friends.length > 0) {
        // Only include friends
        query = query.in('user_id', friends);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      // Flatten the response
      const flattened: LeaderboardEntry[] =
        data?.map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          rating: row.rating,
          games_played: row.games_played,
          full_name: row.profiles?.full_name || null,
          avatar_url: row.profiles?.avatar_url || null,
          level: row.profiles?.level || 1,
          wins: row.profiles?.wins || 0,
          losses: row.profiles?.losses || 0,
        })) || [];

      setEntries(flattened);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [session?.user?.id, type, friends]);

  return { entries, loading, error };
}
