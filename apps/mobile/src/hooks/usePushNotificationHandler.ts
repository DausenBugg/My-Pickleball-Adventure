import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../state/auth';

export function usePushNotificationHandler() {
  const router = useRouter();
  const { session } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    if (!session?.user) return;

    // Handle notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      () => {}
    );

    // Handle notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const data = response.notification.request.content.data;
          
          // Validate data exists
          if (!data || typeof data !== 'object') {
            return;
          }
          
          // Navigate based on notification type with validation
          if (data.achievement_id && typeof data.achievement_id === 'string') {
            router.push('/achievements');
          } else if (data.match_id && typeof data.match_id === 'string') {
            router.push('/(tabs)/home?openNotifications=1');
          } else if (data.friend_request_id && typeof data.friend_request_id === 'string') {
            router.push('/(tabs)/search');
          }
        } catch (error) {
          console.error('Error handling notification tap:', error);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [session?.user, router]);
}
