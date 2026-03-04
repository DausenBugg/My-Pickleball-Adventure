import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

/**
 * Computes a user's global rank (1-based) by counting how many players
 * have a strictly higher rating.  Rank 1 = highest rated = Grandmaster.
 *
 * Works for the logged-in user on the home screen, or any user on the
 * profile screen.
 */
export function useRank(userId: string | null | undefined) {
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRank = async () => {
      setLoading(true);

      try {
        // 1. Get the user's own rating
        const { data: ratingRow, error: ratingErr } = await supabase!
          .from('ratings')
          .select('rating')
          .eq('user_id', userId)
          .single();

        if (ratingErr || !ratingRow) {
          if (!cancelled) {
            setRank(null);
            setLoading(false);
          }
          return;
        }

        // 2. Count how many players have a strictly higher rating
        const { count, error: countErr } = await supabase!
          .from('ratings')
          .select('id', { count: 'exact', head: true })
          .gt('rating', ratingRow.rating);

        if (!cancelled) {
          setRank(countErr ? null : (count ?? 0) + 1);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRank(null);
          setLoading(false);
        }
      }
    };

    fetchRank();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { rank, loading };
}
