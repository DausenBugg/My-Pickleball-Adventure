import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

function parseIssuerFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7).trim();
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payloadPart + '='.repeat((4 - (payloadPart.length % 4)) % 4);
    const payloadJson = atob(paddedPayload);
    const payload = JSON.parse(payloadJson);
    return typeof payload?.iss === 'string' ? payload.iss : null;
  } catch {
    return null;
  }
}

function getAuthDebug(authHeader: string | null) {
  const hasBearerPrefix = !!authHeader && authHeader.startsWith('Bearer ');
  const token = hasBearerPrefix ? authHeader!.slice(7).trim() : '';

  return {
    hasAuthHeader: !!authHeader,
    hasBearerPrefix,
    tokenLength: token.length,
    tokenIssuer: parseIssuerFromAuthHeader(authHeader),
  };
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
    console.error('[process-match-approval] auth.getUser failed:', {
      message: error.message,
      status: (error as any)?.status,
      name: (error as any)?.name,
    });
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
    const authDebug = getAuthDebug(authHeader);
    const userId = await getUserIdFromAuthHeader(authHeader);
    if (!userId) {
      console.error('[process-match-approval] Missing/invalid Authorization header', authDebug);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session token. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { matchId } = await req.json();

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

    // Only process pending matches
    if (match.status !== 'pending') {
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
      }
    }

    // Insert XP events
    if (xpEvents.length > 0) {
      const { error: xpInsertError } = await supabaseClient.from('xp_events').insert(xpEvents);
      if (xpInsertError) {
        console.error('[process-match-approval] Error inserting XP events:', xpInsertError);
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

        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ total_xp: newTotalXP, level: newLevel })
          .eq('id', event.user_id);

        if (updateError) {
          console.error('[process-match-approval] Error updating profile XP:', event.user_id, updateError);
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
    }

    // If this is a ranked match, update ratings
    let updateRatingsResult: { status: number; body: string } | null = null;
    const incomingAuth = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const internalAuthHeader = serviceRoleKey
      ? `Bearer ${serviceRoleKey}`
      : incomingAuth || '';
    if (match.match_mode === 'ranked') {
      try {
        const updateResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-ratings`,
          {
            method: 'POST',
            headers: {
              ...(internalAuthHeader ? { Authorization: internalAuthHeader } : {}),
              ...(anonKey ? { apikey: anonKey } : {}),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ matchId }),
          }
        );

        const updateBody = await updateResponse.text();
        updateRatingsResult = { status: updateResponse.status, body: updateBody };
      } catch (ratingError) {
        console.error('[process-match-approval] Error invoking update-ratings:', ratingError);
      }
    }

    // Check achievements for all participants
    const achievementChecks = participants.map((p: any) =>
      supabaseClient.functions.invoke('check-achievements', {
        headers: {
          ...(internalAuthHeader ? { Authorization: internalAuthHeader } : {}),
          ...(anonKey ? { apikey: anonKey } : {}),
        },
        body: { userId: p.user_id },
      })
    );
    
    try {
      await Promise.all(achievementChecks);
    } catch (achievementError) {
      console.error('[process-match-approval] Error checking achievements:', achievementError);
    }
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
