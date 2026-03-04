import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type TimePeriod = '7d' | '30d' | '90d' | 'all';

export interface RatingDataPoint {
  date: string; // ISO date string
  value: number;
}

export interface WinRateByPeriod {
  label: string;
  period: TimePeriod;
  winRate: number;
  wins: number;
  losses: number;
  total: number;
}

export interface GamesPerWeek {
  week: string; // e.g. "Feb 3"
  count: number;
}

export interface ModeBreakdown {
  ranked: number;
  casual: number;
}

export interface TypeBreakdown {
  singles: number;
  doubles: number;
}

export interface Statistics {
  ratingHistory: RatingDataPoint[];
  winRateByPeriod: WinRateByPeriod[];
  gamesPerWeek: GamesPerWeek[];
  modeBreakdown: ModeBreakdown;
  typeBreakdown: TypeBreakdown;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
}

function getDateThreshold(period: TimePeriod): Date | null {
  if (period === 'all') return null;
  const now = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function getWeekLabel(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Start of ISO week (Monday)
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function useStatistics(period: TimePeriod = 'all') {
  const { session } = useAuth();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const userId = session?.user?.id;
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [ratingHistoryRes, participationsRes, profileRes] = await Promise.all([
        supabase
          .from('rating_history')
          .select('old_rating, new_rating, rating_change, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('match_participants')
          .select(
            `
            match_id,
            team,
            result,
            matches!inner (
              id,
              match_type,
              match_mode,
              status,
              finalized_at,
              winner_team
            )
          `
          )
          .eq('user_id', userId)
          .eq('matches.status', 'approved'),
        supabase
          .from('profiles')
          .select('wins, losses, current_win_streak, best_win_streak')
          .eq('id', userId)
          .single(),
      ]);

      if (ratingHistoryRes.error && __DEV__)
        console.error('Rating history error:', ratingHistoryRes.error);
      if (participationsRes.error && __DEV__)
        console.error('Participations error:', participationsRes.error);

      // ── Rating history ──
      const ratingHistory: RatingDataPoint[] = (ratingHistoryRes.data || []).map(
        (r: any) => ({
          date: r.created_at,
          value: r.new_rating,
        })
      );

      // ── Match data processing ──
      const allMatches = (participationsRes.data || [])
        .filter((p: any) => p.matches)
        .map((p: any) => ({
          match_id: p.match_id,
          team: p.team,
          result: p.result,
          match_type: (p.matches as any).match_type as string,
          match_mode: (p.matches as any).match_mode as string,
          finalized_at: (p.matches as any).finalized_at as string,
          winner_team: (p.matches as any).winner_team as string,
        }));

      // Sort by date
      allMatches.sort(
        (a, b) =>
          new Date(a.finalized_at).getTime() - new Date(b.finalized_at).getTime()
      );

      const dateThreshold = getDateThreshold(period);

      // Filter matches by period for period-sensitive stats
      const periodMatches = dateThreshold
        ? allMatches.filter(
            (m) => new Date(m.finalized_at).getTime() >= dateThreshold.getTime()
          )
        : allMatches;

      // ── Win rate by standard periods ──
      const periods: { label: string; period: TimePeriod }[] = [
        { label: '7 Days', period: '7d' },
        { label: '30 Days', period: '30d' },
        { label: '90 Days', period: '90d' },
        { label: 'All Time', period: 'all' },
      ];

      const winRateByPeriod: WinRateByPeriod[] = periods.map(({ label, period: p }) => {
        const threshold = getDateThreshold(p);
        const filtered = threshold
          ? allMatches.filter(
              (m) => new Date(m.finalized_at).getTime() >= threshold.getTime()
            )
          : allMatches;

        const wins = filtered.filter((m) => m.result === 'win').length;
        const losses = filtered.filter((m) => m.result === 'loss').length;
        const total = filtered.length;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

        return { label, period: p, winRate, wins, losses, total };
      });

      // ── Games per week (for the selected period) ──
      const weekMap = new Map<string, number>();
      periodMatches.forEach((m) => {
        const weekLabel = getWeekLabel(new Date(m.finalized_at));
        weekMap.set(weekLabel, (weekMap.get(weekLabel) || 0) + 1);
      });

      const gamesPerWeek: GamesPerWeek[] = Array.from(weekMap.entries()).map(
        ([week, count]) => ({ week, count })
      );

      // ── Mode breakdown (all time) ──
      const ranked = allMatches.filter((m) => m.match_mode === 'ranked').length;
      const casual = allMatches.filter((m) => m.match_mode === 'casual').length;

      // ── Type breakdown (all time) ──
      const singles = allMatches.filter((m) => m.match_type === 'singles').length;
      const doubles = allMatches.filter((m) => m.match_type === 'doubles').length;

      // ── Profile stats ──
      const profileData = profileRes.data;
      const totalWins = profileData?.wins ?? 0;
      const totalLosses = profileData?.losses ?? 0;
      const totalGames = totalWins + totalLosses;
      const overallWinRate =
        totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

      setStats({
        ratingHistory,
        winRateByPeriod,
        gamesPerWeek,
        modeBreakdown: { ranked, casual },
        typeBreakdown: { singles, doubles },
        currentStreak: profileData?.current_win_streak ?? 0,
        bestStreak: profileData?.best_win_streak ?? 0,
        totalGames,
        totalWins,
        totalLosses,
        overallWinRate,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
      if (__DEV__) console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [session?.user?.id, period]);

  return { stats, loading, error, refresh };
}
