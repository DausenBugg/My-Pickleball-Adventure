import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import {
  mapProfileToPlayer,
  Player,
  PLAYER_SEARCH_SELECT,
  ProfileWithRating,
} from './usePlayerSearch';

const RECENT_MATCH_LIMIT = 40;
const RECENT_PLAYER_LIMIT = 12;

export function useRecentPlayers() {
  const { session } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setPlayers([]);
      setLoading(false);
      setError(null);
      return;
    }

    const client = supabase;

    const fetchRecentPlayers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: participantRows, error: participantError } = await client
          .from('match_participants')
          .select('match_id')
          .eq('user_id', session.user.id)
          .limit(RECENT_MATCH_LIMIT);

        if (participantError) throw participantError;

        const matchIds = Array.from(new Set((participantRows || []).map((row) => row.match_id)));
        if (matchIds.length === 0) {
          setPlayers([]);
          setLoading(false);
          return;
        }

        const { data: matchesData, error: matchesError } = await client
          .from('matches')
          .select('id, created_at')
          .in('id', matchIds)
          .order('created_at', { ascending: false })
          .limit(RECENT_MATCH_LIMIT);

        if (matchesError) throw matchesError;

        const orderedMatchIds = (matchesData || []).map((match) => match.id);
        if (orderedMatchIds.length === 0) {
          setPlayers([]);
          setLoading(false);
          return;
        }

        const { data: otherParticipants, error: othersError } = await client
          .from('match_participants')
          .select(
            `
            match_id,
            user_id,
            profiles(${PLAYER_SEARCH_SELECT})
          `
          )
          .in('match_id', orderedMatchIds)
          .neq('user_id', session.user.id);

        if (othersError) throw othersError;

        const playersByMatch = new Map<string, any[]>();
        (otherParticipants || []).forEach((row: any) => {
          const existing = playersByMatch.get(row.match_id) || [];
          existing.push(row);
          playersByMatch.set(row.match_id, existing);
        });

        const deduped = new Map<string, Player>();

        for (const matchId of orderedMatchIds) {
          const rows = playersByMatch.get(matchId) || [];
          for (const row of rows) {
            if (!row?.user_id || deduped.has(row.user_id)) continue;

            const profile = row.profiles as ProfileWithRating | ProfileWithRating[] | null;
            const normalizedProfile = Array.isArray(profile) ? profile[0] : profile;
            if (!normalizedProfile) continue;

            deduped.set(row.user_id, mapProfileToPlayer(normalizedProfile));

            if (deduped.size >= RECENT_PLAYER_LIMIT) break;
          }

          if (deduped.size >= RECENT_PLAYER_LIMIT) break;
        }

        setPlayers(Array.from(deduped.values()));
      } catch (err: any) {
        setError(err?.message || 'Failed to load recent players');
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPlayers();
  }, [session?.user?.id]);

  return { players, loading, error };
}
