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

type ProfileWithRating = {
  id: string;
  full_name: string | null;
  email: string;
  level: number;
  wins: number;
  losses: number;
  ratings?: { rating?: number }[] | { rating?: number } | null;
};

const PLAYER_SEARCH_SELECT = 'id, full_name, email, level, wins, losses, ratings(rating)';

function mapProfileToPlayer(profile: ProfileWithRating): Player {
  const ratingValue = Array.isArray(profile.ratings)
    ? profile.ratings[0]?.rating
    : profile.ratings?.rating;

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    level: profile.level,
    wins: profile.wins,
    losses: profile.losses,
    rating: ratingValue ?? 1200,
  };
}

export function usePlayerSearch(query: string) {
  const { session } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;

    if (!session?.user?.id || !client || query.trim().length < 2) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const searchPlayers = async () => {
      setLoading(true);
      setError(null);

      const searchTerm = `%${query.trim()}%`;

      const { data, error: searchError } = await client
        .from('profiles')
        .select(PLAYER_SEARCH_SELECT)
        .neq('id', session.user.id)
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .order('full_name')
        .limit(10);

      if (searchError) {
        setError(searchError.message);
        setPlayers([]);
      } else {
        setPlayers((data || []).map((profile) => mapProfileToPlayer(profile as ProfileWithRating)));
      }

      setLoading(false);
    };

    const timeoutId = setTimeout(searchPlayers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, session?.user?.id]);

  return { players, loading, error };
}