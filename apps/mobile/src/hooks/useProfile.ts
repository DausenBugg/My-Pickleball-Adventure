import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user?.id || !supabase) return { error: 'Not authenticated' };

    setLoading(true);
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return { error: updateError.message };
    }

    setProfile(data);
    setLoading(false);
    return { data };
  };

  const uploadAvatar = async () => {
    if (!session?.user?.id || !supabase) return { error: 'Not authenticated' };

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return { error: 'Permission to access photos was denied' };
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return { error: 'Cancelled' };
    }

    const image = result.assets[0];
    
    try {
      // Convert image to blob
      const response = await fetch(image.uri);
      const blob = await response.blob();
      
      // Validate file size (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        return { error: 'Image size must be less than 5MB' };
      }
      
      // Create file path with fallback extension
      const fileExt = image.uri.split('.').pop() || 'jpg';
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        try {
          const oldPath = profile.avatar_url.split('/avatars/').pop();
          if (oldPath) {
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (cleanupError) {
          console.log('Could not delete old avatar:', cleanupError);
          // Continue anyway
        }
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt || 'jpeg'}`,
          upsert: true,
        });

      if (uploadError) {
        return { error: uploadError.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const updateResult = await updateProfile({ avatar_url: urlData.publicUrl });
      
      return updateResult;
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return { profile, loading, error, updateProfile, uploadAvatar };
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
  const xpInCurrentLevel = Math.max(0, currentXP - xpForCurrentLevel);
  const xpNeededForLevel = Math.max(1, xpForNextLevel - xpForCurrentLevel);
  
  if (xpNeededForLevel === 0) return 100;
  
  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
}
