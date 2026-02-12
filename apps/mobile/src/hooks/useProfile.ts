import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  wins: number;
  losses: number;
  created_at: string;
  updated_at: string;
};

export type Rating = {
  id: string;
  user_id: string;
  rating: number;
  games_played: number;
  created_at: string;
  updated_at: string;
};

export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      if (!supabase) return;

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [session?.user?.id]);

  return { profile, loading, error };
}

export function useRating() {
  const { session } = useAuth();
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    const fetchRating = async () => {
      if (!supabase) return;

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setRating(data);
      }

      setLoading(false);
    };

    fetchRating();
  }, [session?.user?.id]);

  return { rating, loading, error };
}

// Calculate XP needed for a given level based on the leveling formula
// XP(N) = 100 * N^1.6
export function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.6));
}

// Calculate XP needed to reach next level
export function calculateXPToNextLevel(currentLevel: number, currentXP: number): number {
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  return Math.max(0, xpForNextLevel - currentXP);
}

// Calculate progress percentage for current level
export function calculateLevelProgress
(currentLevel: number, currentXP: number): number {
  const xpForCurrentLevel = calculateXPForLevel(currentLevel);
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  
  if (xpNeededForLevel === 0) return 100;
  
  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
}
