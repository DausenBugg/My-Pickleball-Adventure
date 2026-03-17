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
  claimed_at: string;
  is_unlocked: boolean;
  progress?: number;
  xp_reward: number;
}

export function useAchievements() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingAchievementId, setClaimingAchievementId] = useState<string | null>(null);

  const fetchAchievements = async (shouldSyncUnlocks = true) => {
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
        .select('achievement_id, earned_at, claimed_at')
        .eq('user_id', session.user.id);

      if (userAchError) throw userAchError;

      const unlockedIds = new Set(
        userAchievements?.map((ua) => ua.achievement_id) || []
      );
      const unlockedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua]) || []
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
          const unlockedAchievement = unlockedMap.get(ach.id);
          const unlocked_at = unlockedAchievement?.earned_at || '';
          const claimed_at = unlockedAchievement?.claimed_at || '';

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
            claimed_at,
            progress: is_unlocked ? 100 : progress,
            xp_reward: TIER_XP_REWARDS[ach.tier] || 50,
          };
        }) || [];

      const hasPendingUnlocks = enrichedAchievements.some(
        (achievement) => !achievement.is_unlocked && (achievement.progress || 0) >= 100
      );

      if (shouldSyncUnlocks && hasPendingUnlocks) {
        const { error: syncError } = await supabase.functions.invoke('check-achievements', {
          body: { userId: session.user.id },
        });

        if (!syncError) {
          await fetchAchievements(false);
          return;
        }

        if (__DEV__) {
          console.error('Failed to sync pending achievement unlocks:', syncError);
        }
      }

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

  const claimAchievementXp = async (achievementId: string) => {
    if (!session?.user?.id || !supabase) return { ok: false, message: 'Not authenticated' };

    setClaimingAchievementId(achievementId);

    try {
      const { error: invokeError } = await supabase.functions.invoke('claim-achievement-reward', {
        body: { achievementId },
      });

      if (invokeError) {
        let detailedMessage = invokeError.message || 'Failed to claim XP reward';
        const invokeErrorContext = (invokeError as any)?.context;

        if (invokeErrorContext && typeof invokeErrorContext === 'object') {
          try {
            const payload = await invokeErrorContext.json();
            if (payload?.error) detailedMessage = payload.error;
            else if (payload?.message) detailedMessage = payload.message;
          } catch {
            // keep fallback message
          }
        }

        return { ok: false, message: detailedMessage };
      }

      await fetchAchievements();
      return { ok: true, message: 'XP reward claimed' };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Failed to claim XP reward' };
    } finally {
      setClaimingAchievementId(null);
    }
  };

  return {
    achievements,
    loading,
    error,
    refresh: fetchAchievements,
    claimAchievementXp,
    claimingAchievementId,
  };
}
