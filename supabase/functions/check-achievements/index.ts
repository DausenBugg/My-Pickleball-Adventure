import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

// No CORS headers needed for mobile-only app (functions called server-to-server or with auth)
const corsHeaders = {
  'Access-Control-Allow-Origin': '', // Disabled for mobile-only
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// XP reward by tier for achievement unlocks
const TIER_XP_REWARDS: Record<string, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 500,
};

serve(async (req) => {
  // Handle preflight (though not needed for mobile)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const isServiceCall = token === serviceRoleKey;
    const internalAuthHeader = serviceRoleKey
      ? `Bearer ${serviceRoleKey}`
      : authHeader;

    let userIdFromToken: string | null = null;

    if (!isServiceCall) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userIdFromToken = user.id;
    }

    // Parse request body - userId is optional, defaults to authenticated user
    // Also accept optional context fields for streak/loss-recovery achievements
    let userId: string | null = userIdFromToken;
    let isWin: boolean | null = null;
    let previousLossStreak: number = 0;
    try {
      const body = await req.json();
      userId = body.userId || userId;
      if (typeof body.is_win === 'boolean') isWin = body.is_win;
      if (typeof body.previous_loss_streak === 'number') previousLossStreak = body.previous_loss_streak;
    } catch {
      // keep fallback from authenticated token
    }

    // Validate UUID format
    if (!isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization: Users can only check their own achievements
    // (Service-to-service calls from other edge functions use service role)
    if (!isServiceCall && userId !== userIdFromToken) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to check achievements for this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = supabaseAdmin;

    // Get user's current stats
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('wins, losses, level, total_xp, current_win_streak, best_win_streak, current_loss_streak')
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

    // Batch fetch all user's unlocked achievements (fixes N+1 query)
    const { data: unlockedAchievements } = await supabaseClient
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);
    
    const unlockedSet = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);

    // Check which achievements should be unlocked
    const newUnlocks = [];

    for (const achievement of achievements) {
      // Check if already unlocked (using pre-fetched set)
      if (unlockedSet.has(achievement.id)) continue; // Already unlocked

      // Check if requirement is met
      let shouldUnlock = false;
      switch (achievement.requirement_type) {
        case 'games_played':
          shouldUnlock = (rating?.games_played || 0) >= achievement.requirement_value;
          break;
        case 'wins':
          shouldUnlock = profile.wins >= achievement.requirement_value;
          break;
        case 'win_streak':
          shouldUnlock = (profile.best_win_streak || 0) >= achievement.requirement_value;
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
        case 'bounce_back':
          // Win immediately after at least 1 loss
          shouldUnlock = isWin === true && previousLossStreak >= 1;
          break;
        case 'resilient':
          // Win after N consecutive losses
          shouldUnlock = isWin === true && previousLossStreak >= achievement.requirement_value;
          break;
      }

      if (shouldUnlock) {
        // Unlock achievement
        await supabaseClient.from('user_achievements').insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        // Award XP based on achievement tier
        const xpReward = TIER_XP_REWARDS[achievement.tier] || 50;
        const { error: xpInsertError } = await supabaseClient.from('xp_events').insert({
          user_id: userId,
          match_id: null,
          xp_amount: xpReward,
          reason: `Achievement: ${achievement.name}`,
        });
        if (xpInsertError) {
          console.error('Error inserting achievement XP event:', xpInsertError);
        }

        // Update user's total_xp and recalculate level
        const currentXP = profile.total_xp ?? 0;
        const newTotalXP = currentXP + xpReward;
        let newLevel = 1;
        while (100 * Math.pow(newLevel + 1, 1.6) <= newTotalXP) {
          newLevel++;
        }
        await supabaseClient
          .from('profiles')
          .update({ total_xp: newTotalXP, level: newLevel })
          .eq('id', userId);
        // Keep profile in sync for subsequent iterations
        profile.total_xp = newTotalXP;
        profile.level = newLevel;

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
              headers: {
                ...(internalAuthHeader ? { Authorization: internalAuthHeader } : {}),
                ...(anonKey ? { apikey: anonKey } : {}),
              },
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
