import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str);
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
    console.log('[update-ratings] Request received');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[update-ratings] Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[update-ratings] Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[update-ratings] Authenticated user:', user.id);

    const { matchId } = await req.json();

    console.log('[update-ratings] Processing match:', matchId);

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
      throw new Error('Match not found');
    }

    // Only process approved ranked matches
    if (match.status !== 'approved' || match.match_mode !== 'ranked') {
      return new Response(
        JSON.stringify({ message: 'Match is not an approved ranked match' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all participants with their ratings
    const { data: participants, error: participantsError } = await supabaseClient
      .from('match_participants')
      .select('*')
      .eq('match_id', matchId);

    if (participantsError) {
      throw new Error(`Failed to load participants: ${participantsError.message}`);
    }

    if (!participants || participants.length === 0) {
      throw new Error('No participants found');
    }

    console.log('[update-ratings] Participants:', participants.length);

    // Authorization: Only match participants can trigger rating updates
    const isParticipant = participants.some((p: any) => p.user_id === user.id);
    if (!isParticipant) {
      console.error('[update-ratings] User not a participant:', user.id);
      return new Response(
        JSON.stringify({ error: 'Only match participants can trigger rating updates' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const participantIds = participants.map((p: any) => p.user_id);
    const { data: ratingsData, error: ratingsError } = await supabaseClient
      .from('ratings')
      .select('user_id, rating, games_played')
      .in('user_id', participantIds);

    if (ratingsError) {
      throw new Error(`Failed to load ratings: ${ratingsError.message}`);
    }

    console.log('[update-ratings] Ratings rows:', ratingsData?.length || 0);

    const ratingsByUser = new Map(
      (ratingsData || []).map((rating) => [rating.user_id, rating])
    );

    // Calculate team ratings
    const teamA = participants.filter((p: any) => p.team === 'team_a');
    const teamB = participants.filter((p: any) => p.team === 'team_b');

    const teamARating = teamA.reduce((sum: number, p: any) => {
      const rating = ratingsByUser.get(p.user_id)?.rating ?? 1200;
      return sum + rating;
    }, 0) / teamA.length;
    const teamBRating = teamB.reduce((sum: number, p: any) => {
      const rating = ratingsByUser.get(p.user_id)?.rating ?? 1200;
      return sum + rating;
    }, 0) / teamB.length;

    // Calculate expected scores using Elo formula
    const expectedA = 1 / (1 + Math.pow(10, (teamBRating - teamARating) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (teamARating - teamBRating) / 400));

    // Actual scores (1 for win, 0 for loss)
    const actualA = match.winner_team === 'team_a' ? 1 : 0;
    const actualB = match.winner_team === 'team_b' ? 1 : 0;

    // Update ratings for each player
    const ratingUpdates = [];

    for (const participant of participants) {
      const ratingRow = ratingsByUser.get(participant.user_id);
      const currentRating = ratingRow?.rating ?? 1200;
      const gamesPlayed = (ratingRow?.games_played ?? 0) + 1;

      // Determine K-factor based on games played
      let kFactor = 40;
      if (gamesPlayed > 30) {
        kFactor = 20;
      } else if (gamesPlayed > 10) {
        kFactor = 28;
      }

      // Calculate rating change
      const expected = participant.team === 'team_a' ? expectedA : expectedB;
      const actual = participant.team === 'team_a' ? actualA : actualB;
      let ratingChange = Math.round(kFactor * (actual - expected));

      // Get opponent IDs for this participant
      const opponentTeam = participant.team === 'team_a' ? 'team_b' : 'team_a';
      const opponentIds = participants
        .filter((p: any) => p.team === opponentTeam)
        .map((p: any) => p.user_id);

      // Apply repeat-opponent dampening
      const { data: dampenedChange } = await supabaseClient.rpc(
        'check_repeat_opponent_dampening',
        {
          p_user_id: participant.user_id,
          p_opponent_ids: opponentIds,
          p_rating_change: ratingChange,
        }
      );
      if (dampenedChange !== null) {
        ratingChange = dampenedChange;
      }

      // Apply daily rating gain cap
      const { data: cappedChange } = await supabaseClient.rpc('check_daily_rating_gain', {
        p_user_id: participant.user_id,
        p_new_change: ratingChange,
      });
      if (cappedChange !== null) {
        ratingChange = cappedChange;
      }

      const newRating = Math.max(100, currentRating + ratingChange); // Floor at 100

      ratingUpdates.push({
        userId: participant.user_id,
        oldRating: currentRating,
        newRating,
        change: ratingChange,
        gamesPlayed,
      });

      // Update rating in database
      const { error: ratingUpdateError } = await supabaseClient
        .from('ratings')
        .update({
          rating: newRating,
          games_played: gamesPlayed,
        })
        .eq('user_id', participant.user_id);

      if (ratingUpdateError) {
        console.error('[update-ratings] Rating update failed:', participant.user_id, ratingUpdateError);
      }

      // Insert rating history record
      const { error: historyError } = await supabaseClient.from('rating_history').insert({
        user_id: participant.user_id,
        match_id: matchId,
        old_rating: currentRating,
        new_rating: newRating,
        rating_change: ratingChange,
        opponent_ids: opponentIds,
      });

      if (historyError) {
        console.error('[update-ratings] Rating history insert failed:', participant.user_id, historyError);
      }
    }

    // Win/loss counts are handled by process-match-approval for all match modes

    console.log('[update-ratings] Completed updates:', ratingUpdates.length);
    return new Response(
      JSON.stringify({
        message: 'Ratings updated successfully',
        updates: ratingUpdates,
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
