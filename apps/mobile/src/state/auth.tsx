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
    const client = supabase;

    client.auth
      .getSession()
      .then(async ({ data }) => {
        const initialSession = data.session ?? null;

        if (!initialSession?.access_token) {
          setSession(null);
          return;
        }

        const { data: userData, error: userError } = await client.auth.getUser(
          initialSession.access_token
        );

        if (userError || !userData?.user) {
          const authErrorMessage = userError?.message || '';
          const isInvalidTokenError = /invalid jwt|jwt|token|unauthorized|refresh token/i.test(authErrorMessage);

          if (__DEV__) {
            console.error('[AuthProvider] Failed to validate persisted session', {
              message: authErrorMessage,
              isInvalidTokenError,
            });
          }

          if (isInvalidTokenError) {
            await client.auth.signOut({ scope: 'local' });
            setSession(null);
          } else {
            setSession(initialSession);
          }

          return;
        }

        setSession(initialSession);
      })
      .finally(() => {
        setLoading(false);
        setIsAuthTransitioning(false);
      });

    const { data: subscription } = client.auth.onAuthStateChange(
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
                await savePushToken(token);
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
