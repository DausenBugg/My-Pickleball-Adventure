import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
  let token: string | null = null;

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
      if (__DEV__) console.log('Device module not available');
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
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId ?? undefined,
        });
        token = tokenData?.data;
        if (__DEV__) {
          if (token) {
            console.log('Push token:', token);
          } else {
            console.log('Token data was empty');
          }
        }
      } catch (tokenError) {
        if (__DEV__) console.error('Error getting expo push token:', tokenError);
        return null;
      }
    } else {
      if (__DEV__) console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    if (__DEV__) console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }

  return token;
}

export async function savePushToken(userId: string, token: string) {
  if (!supabase) {
    if (__DEV__) console.error('Supabase not configured');
    return;
  }

  if (!token || !userId) {
    if (__DEV__) console.error('Invalid token or userId');
    return;
  }

  try {
    const deviceName = `${Platform.OS} ${Device?.modelName || Device?.deviceName || 'device'}`;

    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_device_name: deviceName,
    });

    if (error) {
      if (__DEV__) console.error('Error saving push token:', error);
    } else {
      if (__DEV__) console.log('Push token saved successfully');
    }
  } catch (err) {
    if (__DEV__) console.error('Error saving push token:', err);
  }
}

export async function removePushToken(token: string) {
  if (!supabase) return;

  try {
    const { error } = await supabase.rpc('unregister_push_token', {
      p_token: token,
    });

    if (error) {
      if (__DEV__) console.error('Error removing push token:', error);
    }
  } catch (err) {
    if (__DEV__) console.error('Error removing push token:', err);
  }
}
