import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user's current stats
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('wins, losses, level')
      .eq('id', userId)
      .single();

    const { data: rating } = await supabaseClient
      .from('ratings')
      .select('games_played, rating')
      .eq('user_id', userId)
      .single();

    const { count: friendCount } = await supabaseClient
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get all achievements
    const { data: achievements } = await supabaseClient
      .from('achievements')
      .select('*');

    if (!achievements) {
      return new Response(
        JSON.stringify({ message: 'No achievements found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which achievements should be unlocked
    const newUnlocks = [];

    for (const achievement of achievements) {
      // Check if already unlocked
      const { data: existingUnlock } = await supabaseClient
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

      if (existingUnlock) continue; // Already unlocked

      // Check if requirement is met
      let shouldUnlock = false;
      switch (achievement.requirement_type) {
        case 'games_played':
          shouldUnlock = (rating?.games_played || 0) >= achievement.requirement_value;
          break;
        case 'wins':
          shouldUnlock = profile.wins >= achievement.requirement_value;
          break;
        case 'level':
          shouldUnlock = profile.level >= achievement.requirement_value;
          break;
        case 'rating':
          shouldUnlock = (rating?.rating || 0) >= achievement.requirement_value;
          break;
        case 'friends':
          shouldUnlock = (friendCount || 0) >= achievement.requirement_value;
          break;
      }

      if (shouldUnlock) {
        // Unlock achievement
        await supabaseClient.from('user_achievements').insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        // Create notification
        const { data: newNotification } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You've unlocked "${achievement.name}"`,
            data: { achievement_id: achievement.id },
          })
          .select()
          .single();

        newUnlocks.push(achievement);

        // Send push notification
        if (newNotification) {
          try {
            await supabaseClient.functions.invoke('send-push-notifications', {
              body: { notificationIds: [newNotification.id] },
            });
          } catch (pushError) {
            console.error('Failed to send push notification:', pushError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: newUnlocks.length > 0 ? `${newUnlocks.length} achievement(s) unlocked` : 'No new achievements',
        unlocked: newUnlocks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
