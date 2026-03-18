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

    const body = await req.json();
    const matchId = body?.matchId as string | undefined;
    const action = body?.action as string | undefined;
    const notificationId = body?.notificationId as string | undefined;

    // Validate UUID format
    if (!matchId || !isValidUUID(matchId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing match ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete-corrupted-match') {
      if (!notificationId || !isValidUUID(notificationId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid notification ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: notification, error: notificationError } = await supabaseClient
        .from('notifications')
        .select('id, user_id, type, data')
        .eq('id', notificationId)
        .single();

      if (notificationError || !notification) {
        return new Response(
          JSON.stringify({ error: 'Notification not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (notification.user_id !== userId || notification.type !== 'match_approval') {
        return new Response(
          JSON.stringify({ error: 'Not authorized for this notification' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = (notification.data ?? {}) as Record<string, unknown>;
      const notificationMatchId = (data.match_id as string | undefined) || (data.matchId as string | undefined);

      if (!notificationMatchId || notificationMatchId !== matchId) {
        return new Response(
          JSON.stringify({ error: 'Notification does not match this match ID' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: pendingMatch, error: pendingMatchError } = await supabaseClient
        .from('matches')
        .select('id, status')
        .eq('id', matchId)
        .maybeSingle();

      if (pendingMatchError) {
        console.error('[process-match-approval] Error loading match for cleanup:', pendingMatchError);
        return new Response(
          JSON.stringify({ error: 'Failed to load match for cleanup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!pendingMatch) {
        return new Response(
          JSON.stringify({ message: 'Match already deleted', status: 'deleted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (pendingMatch.status !== 'pending') {
        return new Response(
          JSON.stringify({ message: 'Match is not pending', status: pendingMatch.status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabaseClient
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (deleteError) {
        console.error('[process-match-approval] Error deleting corrupted match:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete corrupted match' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Corrupted pending match deleted', status: 'deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    const requiredRejections = match.match_type === 'singles' ? 1 : 2;
    const isRejected = rejectedCount >= requiredRejections;

    if (!isApproved && !isRejected) {
      return new Response(
        JSON.stringify({ message: 'Not enough approvals yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isRejected) {
      // Delete invalidated match and cascade related rows.
      const { error: rejectError } = await supabaseClient
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (rejectError) {
        console.error('[process-match-approval] Error deleting rejected match:', rejectError);
      }

      return new Response(
        JSON.stringify({ message: 'Match invalidated and deleted', status: 'deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Match is approved - award XP
    const xpEvents = [];
    // Track each participant's result for achievement context
    const participantResults: { user_id: string; is_win: boolean }[] = [];
    
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
          xp_amount: xp,
          reason: `${resolvedResult === 'win' ? 'Win' : 'Loss'} in ${match.match_mode} ${match.match_type}`,
        });
      }

      participantResults.push({
        user_id: participant.user_id,
        is_win: resolvedResult === 'win',
      });
    }

    // Insert XP events
    if (xpEvents.length > 0) {
      const { error: xpInsertError } = await supabaseClient.from('xp_events').insert(xpEvents);
      if (xpInsertError) {
        console.error('[process-match-approval] Error inserting XP events:', xpInsertError);
      }
    }

    // Update each user's total XP, level, and streaks
    for (const event of xpEvents) {
      // Fetch current profile for streak data and old level (for level-up detection)
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('level, current_win_streak, best_win_streak')
        .eq('id', event.user_id)
        .single();

      if (profileError) {
        console.error('[process-match-approval] Error fetching profile:', event.user_id, profileError);
        continue;
      }

      if (profile) {
        const oldLevel = profile.level ?? 1;

        // Atomically increment total_xp and recalculate level via RPC
        // This prevents race conditions where concurrent updates overwrite each other
        const { data: xpResult, error: xpRpcError } = await supabaseClient
          .rpc('add_xp_and_recalculate', { p_user_id: event.user_id, p_xp_amount: event.xp_amount });

        if (xpRpcError) {
          console.error('[process-match-approval] Error in add_xp_and_recalculate RPC:', event.user_id, xpRpcError);
        }

        const newLevel = xpResult?.[0]?.new_level ?? oldLevel;

        // Update streaks (separate atomic update — streaks don't affect XP)
        const pResult = participantResults.find(p => p.user_id === event.user_id);
        const isWin = pResult?.is_win ?? false;
        let newWinStreak = profile.current_win_streak ?? 0;
        let newBestWinStreak = profile.best_win_streak ?? 0;

        if (isWin) {
          newWinStreak += 1;
          newBestWinStreak = Math.max(newBestWinStreak, newWinStreak);
        } else {
          newWinStreak = 0;
        }

        const { error: streakError } = await supabaseClient
          .from('profiles')
          .update({
            current_win_streak: newWinStreak,
            best_win_streak: newBestWinStreak,
          })
          .eq('id', event.user_id);

        if (streakError) {
          console.error('[process-match-approval] Error updating streaks:', event.user_id, streakError);
        }

        // If user leveled up, create a level-up notification and send push
        if (newLevel > oldLevel) {
          const { data: newNotification, error: notifError } = await supabaseClient
            .from('notifications')
            .insert({
              user_id: event.user_id,
              type: 'system',
              title: 'Level Up!',
              message: `Congratulations! You reached Level ${newLevel}!`,
              data: { level: newLevel, old_level: oldLevel },
            })
            .select('id')
            .single();

          if (notifError) {
            console.error('[process-match-approval] Error creating level-up notification:', event.user_id, notifError);
          }

          // Send push notification for level-up
          if (newNotification) {
            try {
              const anonKeyForPush = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
              const serviceKeyForPush = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
              const pushAuthHeader = serviceKeyForPush
                ? `Bearer ${serviceKeyForPush}`
                : (req.headers.get('Authorization') || '');

              await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notifications`,
                {
                  method: 'POST',
                  headers: {
                    ...(pushAuthHeader ? { Authorization: pushAuthHeader } : {}),
                    ...(anonKeyForPush ? { apikey: anonKeyForPush } : {}),
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    notificationIds: [newNotification.id],
                  }),
                }
              );
            } catch (pushError) {
              console.error('[process-match-approval] Error sending level-up push:', pushError);
            }
          }
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
