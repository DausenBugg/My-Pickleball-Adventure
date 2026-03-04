import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export interface HeadToHead {
  totalGames: number;
  myWins: number;
  theirWins: number;
  avgScoreDiff: number;
  myCurrentStreak: number;
}

export function useHeadToHead(opponentId: string | null) {
  const { session } = useAuth();
  const [stats, setStats] = useState<HeadToHead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const userId = session?.user?.id;
      if (!userId || !opponentId || !supabase || userId === opponentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: Get all match IDs for current user
        const { data: myParticipations, error: myErr } = await supabase
          .from('match_participants')
          .select('match_id, team')
          .eq('user_id', userId);

        if (myErr) throw myErr;
        if (!myParticipations || myParticipations.length === 0) {
          setStats({ totalGames: 0, myWins: 0, theirWins: 0, avgScoreDiff: 0, myCurrentStreak: 0 });
          setLoading(false);
          return;
        }

        const myMatchIds = myParticipations.map((p) => p.match_id);
        const myTeamByMatch = new Map(myParticipations.map((p) => [p.match_id, p.team]));

        // Step 2: Find shared matches with opponent
        const { data: opponentParticipations, error: opErr } = await supabase
          .from('match_participants')
          .select('match_id, team')
          .eq('user_id', opponentId)
          .in('match_id', myMatchIds);

        if (opErr) throw opErr;
        if (!opponentParticipations || opponentParticipations.length === 0) {
          setStats({ totalGames: 0, myWins: 0, theirWins: 0, avgScoreDiff: 0, myCurrentStreak: 0 });
          setLoading(false);
          return;
        }

        const sharedMatchIds = opponentParticipations.map((p) => p.match_id);

        // Step 3: Fetch full match data for shared matches (approved only)
        const { data: matches, error: matchErr } = await supabase
          .from('matches')
          .select('id, winner_team, team_a_score, team_b_score, finalized_at')
          .in('id', sharedMatchIds)
          .eq('status', 'approved')
          .order('finalized_at', { ascending: false });

        if (matchErr) throw matchErr;
        if (!matches || matches.length === 0) {
          setStats({ totalGames: 0, myWins: 0, theirWins: 0, avgScoreDiff: 0, myCurrentStreak: 0 });
          setLoading(false);
          return;
        }

        // Step 4: Compute stats
        let myWins = 0;
        let theirWins = 0;
        let totalScoreDiff = 0;
        let currentStreak = 0;
        let streakCounting = true;

        for (const match of matches) {
          const myTeam = myTeamByMatch.get(match.id);
          const iWon = match.winner_team === myTeam;

          if (iWon) {
            myWins++;
          } else {
            theirWins++;
          }

          // Score differential from my perspective
          const myScore = myTeam === 'team_a' ? match.team_a_score : match.team_b_score;
          const theirScore = myTeam === 'team_a' ? match.team_b_score : match.team_a_score;
          totalScoreDiff += myScore - theirScore;

          // Current streak (most recent consecutive wins)
          if (streakCounting) {
            if (iWon) {
              currentStreak++;
            } else {
              streakCounting = false;
            }
          }
        }

        const totalGames = matches.length;
        const avgScoreDiff = totalGames > 0 ? totalScoreDiff / totalGames : 0;

        setStats({
          totalGames,
          myWins,
          theirWins,
          avgScoreDiff: Math.round(avgScoreDiff * 10) / 10,
          myCurrentStreak: currentStreak,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load head-to-head stats');
        if (__DEV__) console.error('Error fetching H2H:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [session?.user?.id, opponentId]);

  return { stats, loading, error };
}
