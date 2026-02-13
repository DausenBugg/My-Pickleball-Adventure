import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { supabase } from './supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Safety check for Device module
    if (!Device || typeof Device.isDevice === 'undefined') {
      console.log('Device module not available');
      return undefined;
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return undefined;
      }
      
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData?.data;
        if (token) {
          console.log('Push token:', token);
        } else {
          console.log('Token data was empty');
        }
      } catch (tokenError) {
        console.error('Error getting expo push token:', tokenError);
        return undefined;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return undefined;
  }

  return token;
}

export async function savePushToken(userId: string, token: string) {
  if (!supabase) {
    console.error('Supabase not configured');
    return;
  }

  if (!token || !userId) {
    console.error('Invalid token or userId');
    return;
  }

  try {
    const deviceName = `${Platform.OS} ${Device?.modelName || Device?.deviceName || 'device'}`;
    
    // Upsert the token
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          device_name: deviceName,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'token',
        }
      );

    if (error) {
      console.error('Error saving push token:', error);
    } else {
      console.log('Push token saved successfully');
    }
  } catch (err) {
    console.error('Error saving push token:', err);
  }
}

export async function removePushToken(token: string) {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error removing push token:', error);
    }
  } catch (err) {
    console.error('Error removing push token:', err);
  }
}
