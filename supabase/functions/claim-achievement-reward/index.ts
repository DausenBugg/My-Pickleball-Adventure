import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIER_XP_REWARDS: Record<string, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 500,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Parse request body
    const { achievementId } = await req.json();

    if (!achievementId || !isValidUUID(achievementId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing achievement ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user has unlocked this achievement
    const { data: userAchievement, error: uaError } = await supabaseAdmin
      .from('user_achievements')
      .select('id, claimed_at, achievement_id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (uaError || !userAchievement) {
      return new Response(
        JSON.stringify({ error: 'Achievement not unlocked' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already claimed
    if (userAchievement.claimed_at) {
      return new Response(
        JSON.stringify({ error: 'Reward already claimed', claimed_at: userAchievement.claimed_at }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get achievement details for XP reward
    const { data: achievement, error: achError } = await supabaseAdmin
      .from('achievements')
      .select('id, name, tier, key')
      .eq('id', achievementId)
      .single();

    if (achError || !achievement) {
      return new Response(
        JSON.stringify({ error: 'Achievement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as claimed
    const { error: claimError } = await supabaseAdmin
      .from('user_achievements')
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', userAchievement.id);

    if (claimError) {
      console.error('[claim-achievement-reward] Error claiming:', claimError);
      throw new Error('Failed to claim reward');
    }

    const xpReward = TIER_XP_REWARDS[achievement.tier] || 50;

    return new Response(
      JSON.stringify({
        message: 'Reward claimed',
        achievement: achievement.name,
        tier: achievement.tier,
        xp_reward: xpReward,
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
