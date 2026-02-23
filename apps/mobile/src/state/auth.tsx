import { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  registerForPushNotificationsAsync,
  savePushToken,
} from '../lib/notifications';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  isAuthTransitioning: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  configured: false,
  isAuthTransitioning: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setIsAuthTransitioning(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
      setIsAuthTransitioning(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        setIsAuthTransitioning(true);
        setSession(nextSession);
        
        // Register for push notifications when user logs in
        if (
          nextSession?.user &&
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')
        ) {
          try {
            const preference = await AsyncStorage.getItem('notifications_enabled');
            if (preference !== 'false') {
              const token = await registerForPushNotificationsAsync();
              if (token && typeof token === 'string') {
                await savePushToken(nextSession.user.id, token);
              }
            }
          } catch (error) {
            if (__DEV__) console.error('Error registering push notifications:', error);
          }
        }

        setIsAuthTransitioning(false);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, loading, configured: isSupabaseConfigured, isAuthTransitioning }),
    [session, loading, isAuthTransitioning]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
