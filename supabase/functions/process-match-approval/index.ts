import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

async function getUserIdFromAuthHeader(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();
  if (error) {
    console.error('[process-match-approval] auth.getUser failed:', error.message);
    return null;
  }

  const userId = data.user?.id;
  return userId && isValidUUID(userId) ? userId : null;
}

// No CORS wildcard for mobile-only app
const corsHeaders = {
  'Access-Control-Allow-Origin': '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const userId = await getUserIdFromAuthHeader(authHeader);
    if (!userId) {
      console.error('[process-match-approval] Missing/invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session token. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[process-match-approval] Authenticated user:', userId);

    const { matchId } = await req.json();
    console.log('[process-match-approval] Processing match:', matchId);

    // Validate UUID format
    if (!matchId || !isValidUUID(matchId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing match ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get match details
    const { data: match, error: matchError } = await supabaseClient
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('[process-match-approval] Match not found error:', matchError);
      throw new Error('Match not found');
    }

    console.log('[process-match-approval] Match found:', {
      id: match.id,
      status: match.status,
      match_type: match.match_type,
      match_mode: match.match_mode,
      winner_team: match.winner_team,
    });

    // Only process pending matches
    if (match.status !== 'pending') {
      console.log('[process-match-approval] Match not pending, skipping:', match.status);
      return new Response(
        JSON.stringify({ message: 'Match is not pending', status: match.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabaseClient
      .from('match_participants')
      .select('*')
      .eq('match_id', matchId);

    if (participantsError || !participants) {
      console.error('[process-match-approval] Participants fetch error:', participantsError);
      throw new Error('No participants found');
    }

    console.log('[process-match-approval] Participants:', participants.length);

    // Authorization: Only match participants can trigger approval processing
    const isParticipant = participants.some((p: any) => p.user_id === userId);
    if (!isParticipant) {
      console.error('[process-match-approval] User not a participant:', userId);
      return new Response(
        JSON.stringify({ error: 'Only match participants can process approvals' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all approvals
    const { data: approvals, error: approvalsError } = await supabaseClient
      .from('match_approvals')
      .select('*')
      .eq('match_id', matchId);

    if (approvalsError) {
      console.error('[process-match-approval] Approvals fetch error:', approvalsError);
    }

    const approvedCount = approvals?.filter((a: any) => a.approved).length || 0;
    const rejectedCount = approvals?.filter((a: any) => !a.approved).length || 0;
    
    console.log('[process-match-approval] Approval status:', {
      approved: approvedCount,
      rejected: rejectedCount,
      required: match.match_type === 'singles' ? 2 : 3,
    });

    // Check if match meets approval threshold
    const requiredApprovals = match.match_type === 'singles' ? 2 : 3;
    const isApproved = approvedCount >= requiredApprovals;
    const isRejected = rejectedCount > 0; // Any rejection kills the match

    if (!isApproved && !isRejected) {
      console.log('[process-match-approval] Not enough votes yet');
      return new Response(
        JSON.stringify({ message: 'Not enough approvals yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isRejected) {
      console.log('[process-match-approval] Match rejected');
      // Update match status to rejected
      const { error: rejectError } = await supabaseClient
        .from('matches')
        .update({ status: 'rejected', finalized_at: new Date().toISOString() })
        .eq('id', matchId);

      if (rejectError) {
        console.error('[process-match-approval] Error updating match to rejected:', rejectError);
      }

      return new Response(
        JSON.stringify({ message: 'Match rejected', status: 'rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Match is approved - award XP
    console.log('[process-match-approval] Match approved, awarding XP');
    const xpEvents = [];
    
    for (const participant of participants) {
      let xp = 0;
      const resolvedResult = participant.result ??
        (participant.team === match.winner_team ? 'win' : 'loss');

      // Base XP
      if (resolvedResult === 'win') {
        xp = 120;
      } else if (resolvedResult === 'loss') {
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
          reason: `${resolvedResult === 'win' ? 'Win' : 'Loss'} in ${match.match_mode} ${match.match_type}`,
        });
        console.log('[process-match-approval] XP event queued:', {
          user_id: participant.user_id,
          amount: xp,
          result: resolvedResult,
        });
      }
    }

    // Insert XP events
    if (xpEvents.length > 0) {
      const { error: xpInsertError } = await supabaseClient.from('xp_events').insert(xpEvents);
      if (xpInsertError) {
        console.error('[process-match-approval] Error inserting XP events:', xpInsertError);
      } else {
        console.log('[process-match-approval] XP events inserted successfully');
      }
    }

    // Update each user's total XP and level
    for (const event of xpEvents) {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('total_xp')
        .eq('id', event.user_id)
        .single();

      if (profileError) {
        console.error('[process-match-approval] Error fetching profile:', event.user_id, profileError);
        continue;
      }

      if (profile) {
        const currentTotalXP = profile.total_xp ?? 0;
        const newTotalXP = currentTotalXP + event.amount;
        
        // Calculate new level based on XP formula: XP(N) = 100 * N^1.6
        let newLevel = 1;
        while (100 * Math.pow(newLevel + 1, 1.6) <= newTotalXP) {
          newLevel++;
        }

        console.log('[process-match-approval] Updating profile:', {
          user_id: event.user_id,
          oldXP: profile.total_xp,
          newXP: newTotalXP,
          oldLevel: profile.level || 1,
          newLevel,
        });

        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ total_xp: newTotalXP, level: newLevel })
          .eq('id', event.user_id);

        if (updateError) {
          console.error('[process-match-approval] Error updating profile XP:', event.user_id, updateError);
        } else {
          console.log('[process-match-approval] Profile XP updated successfully');
        }
      }
    }

    // Increment wins/losses for all match modes (casual + ranked)
    for (const participant of participants) {
      const resolvedResult = participant.result ??
        (participant.team === match.winner_team ? 'win' : 'loss');

      if (resolvedResult === 'win') {
        await supabaseClient.rpc('increment_wins', { user_id: participant.user_id });
      } else if (resolvedResult === 'loss') {
        await supabaseClient.rpc('increment_losses', { user_id: participant.user_id });
      }
    }

    // Update match status to approved
    const { error: statusError } = await supabaseClient
      .from('matches')
      .update({ status: 'approved', finalized_at: new Date().toISOString() })
      .eq('id', matchId);

    if (statusError) {
      console.error('[process-match-approval] Error updating match status:', statusError);
    } else {
      console.log('[process-match-approval] Match status updated to approved');
    }

    // If this is a ranked match, update ratings
    let updateRatingsResult: { status: number; body: string } | null = null;
    if (match.match_mode === 'ranked') {
      console.log('[process-match-approval] Invoking update-ratings for ranked match');
      try {
        const incomingAuth = req.headers.get('Authorization');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const authHeader = incomingAuth || (anonKey ? `Bearer ${anonKey}` : '');
        console.log('[process-match-approval] update-ratings auth source:', incomingAuth ? 'incoming' : anonKey ? 'anon' : 'none');
        const updateResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-ratings`,
          {
            method: 'POST',
            headers: {
              ...(authHeader ? { Authorization: authHeader } : {}),
              ...(anonKey ? { apikey: anonKey } : {}),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ matchId }),
          }
        );

        const updateBody = await updateResponse.text();
        updateRatingsResult = { status: updateResponse.status, body: updateBody };
        console.log('[process-match-approval] update-ratings response:', updateResponse.status, updateBody);
      } catch (ratingError) {
        console.error('[process-match-approval] Error invoking update-ratings:', ratingError);
      }
    }

    // Check achievements for all participants
    console.log('[process-match-approval] Invoking check-achievements for all participants');
    const achievementChecks = participants.map((p: any) =>
      supabaseClient.functions.invoke('check-achievements', {
        body: { userId: p.user_id },
      })
    );
    
    try {
      await Promise.all(achievementChecks);
      console.log('[process-match-approval] All achievement checks completed');
    } catch (achievementError) {
      console.error('[process-match-approval] Error checking achievements:', achievementError);
    }

    console.log('[process-match-approval] Match processing completed successfully');
    return new Response(
      JSON.stringify({
        message: 'Match approved and XP awarded',
        status: 'approved',
        xpAwarded: xpEvents,
        updateRatings: updateRatingsResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[process-match-approval] Caught error:', error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
