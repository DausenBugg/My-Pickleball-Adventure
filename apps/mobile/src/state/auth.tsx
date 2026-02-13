import { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  registerForPushNotificationsAsync,
  savePushToken,
} from '../lib/notifications';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  configured: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        
        // Register for push notifications when user logs in
        if (nextSession?.user && !session) {
          try {
            const token = await registerForPushNotificationsAsync();
            if (token && typeof token === 'string') {
              await savePushToken(nextSession.user.id, token);
            } else {
              console.log('No valid push token received');
            }
          } catch (error) {
            console.error('Error registering push notifications:', error);
          }
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, loading, configured: isSupabaseConfigured }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
