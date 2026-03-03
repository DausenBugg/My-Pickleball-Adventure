import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const watchSupabaseUrl =
  typeof extra.watchSupabaseUrl === 'string' ? extra.watchSupabaseUrl : undefined;
const watchSupabaseAnonKey =
  typeof extra.watchSupabaseAnonKey === 'string' ? extra.watchSupabaseAnonKey : undefined;

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? watchSupabaseUrl;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? watchSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;