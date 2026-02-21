import { useEffect, useState } from 'react';
import * as ExpoFileSystem from 'expo-file-system';

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

  const refresh = async () => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

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

  useEffect(() => {
    refresh();
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

    let imagePickerModule: any;
    try {
      imagePickerModule = require('expo-image-picker');
    } catch {
      return { error: 'Image upload requires a development/production build (not Expo Go)' };
    }

    const ImagePicker = imagePickerModule?.default ?? imagePickerModule;
    if (
      !ImagePicker?.requestMediaLibraryPermissionsAsync ||
      !ImagePicker?.launchImageLibraryAsync
    ) {
      return { error: 'Image picker is unavailable in this build. Reinstall your dev client.' };
    }

    // Request permission
    let status = 'denied';
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = permission?.status;
    } catch {
      return { error: 'Unable to access media permissions. Please reinstall your dev client.' };
    }

    if (status !== 'granted') {
      return { error: 'Permission to access photos was denied' };
    }

    // Pick image
    let result: any;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
    } catch {
      return { error: 'Failed to open image picker. Please reinstall your dev client.' };
    }

    if (result.canceled) {
      return { error: 'Cancelled' };
    }

    const image = result.assets?.[0];
    if (!image) {
      return { error: 'No image selected' };
    }
    
    try {
      const fileExt =
        image.fileName?.split('.').pop() || image.uri.split('.').pop() || 'jpg';
      const mimeType = image.mimeType || `image/${fileExt}`;

      const base64Data = image.base64
        ? image.base64
        : await ExpoFileSystem.readAsStringAsync(image.uri, {
            encoding: 'base64',
          });

      const binaryString = globalThis.atob
        ? globalThis.atob(base64Data)
        : atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Validate file size (max 5MB)
      if (bytes.length > 5 * 1024 * 1024) {
        return { error: 'Image size must be less than 5MB' };
      }
      
      // Create file path with fallback extension
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
        .upload(fileName, bytes, {
          contentType: mimeType,
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

  return { profile, loading, error, updateProfile, uploadAvatar, refresh };
}

export function useRating() {
  const { session } = useAuth();
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

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

  useEffect(() => {
    refresh();
  }, [session?.user?.id]);

  return { rating, loading, error, refresh };
}

// Calculate XP needed for a given level based on the leveling formula
// XP(N) = 100 * N^1.6, rounded up to the nearest 10.
export function calculateXPForLevel(level: number): number {
  const rawXp = 100 * Math.pow(level, 1.6);
  return Math.ceil(rawXp / 10) * 10;
}

// Calculate XP needed to reach next level
export function calculateXPToNextLevel(currentLevel: number, currentXP: number): number {
  const xpForCurrentLevel = calculateXPForLevel(currentLevel);
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  const clampedXP = Math.max(currentXP, xpForCurrentLevel);
  return Math.max(0, xpForNextLevel - clampedXP);
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
