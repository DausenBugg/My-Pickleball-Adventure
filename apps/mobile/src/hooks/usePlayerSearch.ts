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
        .select('id, full_name, email, level, wins, losses, ratings(rating)')
        .neq('id', session.user.id) // Exclude current user
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .order('full_name')
        .limit(10);

      if (searchError) {
        setError(searchError.message);
        setPlayers([]);
      } else {
        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          level: p.level,
          wins: p.wins,
          losses: p.losses,
          rating: p.ratings?.[0]?.rating ?? p.ratings?.rating ?? 1200,
        }));
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
