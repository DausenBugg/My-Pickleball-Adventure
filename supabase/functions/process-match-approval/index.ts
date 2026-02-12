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

    const { matchId } = await req.json();

    if (!matchId) {
      throw new Error('Match ID is required');
    }

    // Get match details
    const { data: match, error: matchError } = await supabaseClient
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new Error('Match not found');
    }

    // Only process pending matches
    if (match.status !== 'pending') {
      return new Response(
        JSON.stringify({ message: 'Match is not pending' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all participants
    const { data: participants } = await supabaseClient
      .from('match_participants')
      .select('*')
      .eq('match_id', matchId);

    if (!participants) {
      throw new Error('No participants found');
    }

    // Get all approvals
    const { data: approvals } = await supabaseClient
      .from('match_approvals')
      .select('*')
      .eq('match_id', matchId);

    const approvedCount = approvals?.filter((a) => a.approved).length || 0;
    const rejectedCount = approvals?.filter((a) => !a.approved).length || 0;

    // Check if match meets approval threshold
    const requiredApprovals = match.match_type === 'singles' ? 2 : 3;
    const isApproved = approvedCount >= requiredApprovals;
    const isRejected = rejectedCount > 0; // Any rejection kills the match

    if (!isApproved && !isRejected) {
      return new Response(
        JSON.stringify({ message: 'Not enough approvals yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isRejected) {
      // Update match status to rejected
      await supabaseClient
        .from('matches')
        .update({ status: 'rejected', finalized_at: new Date().toISOString() })
        .eq('id', matchId);

      return new Response(
        JSON.stringify({ message: 'Match rejected', status: 'rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Match is approved - award XP
    const xpEvents = [];
    
    for (const participant of participants) {
      let xp = 0;

      // Base XP
      if (participant.result === 'win') {
        xp = 120;
      } else if (participant.result === 'loss') {
        xp = 70;
      }

      // Ranked bonus
      if (match.match_mode === 'ranked') {
        xp += 20;
      }

      if (xp > 0) {
        xpEvents.push({
          user_id: participant.user_id,
          match_id: matchId,
          amount: xp,
          reason: `${participant.result === 'win' ? 'Win' : 'Loss'} in ${match.match_mode} ${match.match_type}`,
        });
      }
    }

    // Insert XP events
    if (xpEvents.length > 0) {
      await supabaseClient.from('xp_events').insert(xpEvents);
    }

    // Update each user's total XP and level
    for (const event of xpEvents) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('total_xp')
        .eq('id', event.user_id)
        .single();

      if (profile) {
        const newTotalXP = profile.total_xp + event.amount;
        
        // Calculate new level based on XP formula: XP(N) = 100 * N^1.6
        let newLevel = 1;
        while (100 * Math.pow(newLevel + 1, 1.6) <= newTotalXP) {
          newLevel++;
        }

        await supabaseClient
          .from('profiles')
          .update({ total_xp: newTotalXP, level: newLevel })
          .eq('id', event.user_id);
      }
    }

    // Update match status to approved
    await supabaseClient
      .from('matches')
      .update({ status: 'approved', finalized_at: new Date().toISOString() })
      .eq('id', matchId);

    // Check achievements for all participants
    const achievementChecks = participants.map((p) =>
      supabaseClient.functions.invoke('check-achievements', {
        body: { userId: p.user_id },
      })
    );
    await Promise.all(achievementChecks);

    return new Response(
      JSON.stringify({
        message: 'Match approved and XP awarded',
        status: 'approved',
        xpAwarded: xpEvents,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
