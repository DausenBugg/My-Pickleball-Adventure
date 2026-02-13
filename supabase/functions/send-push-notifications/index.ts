import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: any;
  badge?: number;
}

async function sendPushNotifications(notifications: PushNotification[]) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(notifications),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send push notifications: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { notificationIds } = await req.json();

    // Validate input
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'notificationIds array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate notification IDs are strings
    if (!notificationIds.every((id) => typeof id === 'string')) {
      return new Response(
        JSON.stringify({ error: 'All notification IDs must be strings' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch notifications with user tokens
    const { data: notifications, error: notificationsError } = await supabaseClient
      .from('notifications')
      .select(`
        id,
        user_id,
        title,
        body,
        data,
        profiles!inner (
          id
        )
      `)
      .in('id', notificationIds);

    if (notificationsError) {
      throw new Error(`Error fetching notifications: ${notificationsError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No notifications found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get push tokens for all users
    const userIds = [...new Set(notifications.map((n) => n.user_id))];
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', userIds);

    if (tokensError) {
      throw new Error(`Error fetching push tokens: ${tokensError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for users');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No push tokens found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a map of user_id to tokens
    const userTokens = new Map<string, string[]>();
    tokens.forEach((token) => {
      const existing = userTokens.get(token.user_id) || [];
      existing.push(token.token);
      userTokens.set(token.user_id, existing);
    });

    // Build push notifications
    const pushNotifications: PushNotification[] = [];
    notifications.forEach((notification) => {
      const userPushTokens = userTokens.get(notification.user_id) || [];
      userPushTokens.forEach((token) => {
        // Validate token format (Expo push tokens start with ExponentPushToken)
        if (!token || typeof token !== 'string' || token.trim().length === 0) {
          console.warn('Invalid push token format:', token);
          return;
        }
        
        pushNotifications.push({
          to: token,
          sound: 'default',
          title: notification.title || 'New Notification',
          body: notification.body || '',
          data: notification.data || {},
        });
      });
    });

    if (pushNotifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No valid push tokens' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications
    const result = await sendPushNotifications(pushNotifications);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: pushNotifications.length,
        result 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
