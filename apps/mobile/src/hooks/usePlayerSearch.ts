import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type Player = {
  id: string;
  full_name: string | null;
  email: string;
  level: number;
  wins: number;
  losses: number;
  rating: number;
};

export type ProfileWithRating = {
  id: string;
  full_name: string | null;
  email: string;
  level: number;
  wins: number;
  losses: number;
  ratings?: { rating?: number }[] | { rating?: number } | null;
};

export const PLAYER_SEARCH_SELECT = 'id, full_name, email, level, wins, losses, ratings(rating)';

export function mapProfileToPlayer(profile: ProfileWithRating): Player {
  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    level: profile.level,
    wins: profile.wins,
    losses: profile.losses,
    rating: profile.ratings?.[0]?.rating ?? profile.ratings?.rating ?? 1200,
  };
}

export function usePlayerSearch(query: string) {
  const { session } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !supabase || query.trim().length < 2) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const searchPlayers = async () => {
      setLoading(true);
      setError(null);

      if (!supabase) return;

      const searchTerm = `%${query.trim()}%`;

      const { data, error: searchError } = await supabase
        .from('profiles')
        .select(PLAYER_SEARCH_SELECT)
        .neq('id', session.user.id) // Exclude current user
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .order('full_name')
        .limit(10);

      if (searchError) {
        setError(searchError.message);
        setPlayers([]);
      } else {
        const mapped = (data || []).map((profile) => mapProfileToPlayer(profile as ProfileWithRating));
        setPlayers(mapped);
      }

      setLoading(false);
    };

    // Debounce the search
    const timeoutId = setTimeout(searchPlayers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, session?.user?.id]);

  return { players, loading, error };
}
