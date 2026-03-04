import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement_type: string;
  requirement_value: number;
}

// XP reward by tier (matches backend TIER_XP_REWARDS)
const TIER_XP_REWARDS: Record<string, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 500,
};

export interface UserAchievement extends Achievement {
  unlocked_at: string;
  is_unlocked: boolean;
  progress?: number;
  xp_reward: number;
}

export function useAchievements() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all achievements
      const { data: allAchievements, error: achError } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (achError) throw achError;

      // Get user's unlocked achievements
      const { data: userAchievements, error: userAchError } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', session.user.id);

      if (userAchError) throw userAchError;

      const unlockedIds = new Set(
        userAchievements?.map((ua) => ua.achievement_id) || []
      );
      const unlockedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua.earned_at]) || []
      );

      // Get user's current stats for progress
      const { data: profile } = await supabase
        .from('profiles')
        .select('wins, losses, level, best_win_streak')
        .eq('id', session.user.id)
        .single();

      const { data: rating } = await supabase
        .from('ratings')
        .select('games_played, rating')
        .eq('user_id', session.user.id)
        .single();

      const { count: friendCount } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`);

      // Merge data and calculate progress
      const enrichedAchievements: UserAchievement[] =
        allAchievements?.map((ach) => {
          const is_unlocked = unlockedIds.has(ach.id);
          const unlocked_at = unlockedMap.get(ach.id) || '';

          let progress = 0;
          if (!is_unlocked) {
            switch (ach.requirement_type) {
              case 'games_played':
                progress = Math.min(
                  ((rating?.games_played || 0) / ach.requirement_value) * 100,
                  100
                );
                break;
              case 'wins':
                progress = Math.min(
                  ((profile?.wins || 0) / ach.requirement_value) * 100,
                  100
                );
                break;
              case 'win_streak':
                progress = Math.min(
                  ((profile?.best_win_streak || 0) / ach.requirement_value) * 100,
                  100
                );
                break;
              case 'level':
                progress = Math.min(
                  ((profile?.level || 1) / ach.requirement_value) * 100,
                  100
                );
                break;
              case 'rating':
                progress = Math.min(
                  ((rating?.rating || 0) / ach.requirement_value) * 100,
                  100
                );
                break;
              case 'friends':
                progress = Math.min(
                  ((friendCount || 0) / ach.requirement_value) * 100,
                  100
                );
                break;
            }
          }

          return {
            ...ach,
            is_unlocked,
            unlocked_at,
            progress: is_unlocked ? 100 : progress,
            xp_reward: TIER_XP_REWARDS[ach.tier] || 50,
          };
        }) || [];

      setAchievements(enrichedAchievements);
    } catch (err: any) {
      setError(err.message || 'Failed to load achievements');
      if (__DEV__) console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [session?.user?.id]);

  return {
    achievements,
    loading,
    error,
    refresh: fetchAchievements,
  };
}
