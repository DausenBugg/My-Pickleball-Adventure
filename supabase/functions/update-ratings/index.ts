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

    // Only process approved ranked matches
    if (match.status !== 'approved' || match.match_mode !== 'ranked') {
      return new Response(
        JSON.stringify({ message: 'Match is not an approved ranked match' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all participants with their ratings
    const { data: participants } = await supabaseClient
      .from('match_participants')
      .select(`
        *,
        ratings (rating, games_played)
      `)
      .eq('match_id', matchId);

    if (!participants || participants.length === 0) {
      throw new Error('No participants found');
    }

    // Calculate team ratings
    const teamA = participants.filter((p) => p.team === 'team_a');
    const teamB = participants.filter((p) => p.team === 'team_b');

    const teamARating = teamA.reduce((sum, p) => sum + (p.ratings?.rating || 1200), 0) / teamA.length;
    const teamBRating = teamB.reduce((sum, p) => sum + (p.ratings?.rating || 1200), 0) / teamB.length;

    // Calculate expected scores using Elo formula
    const expectedA = 1 / (1 + Math.pow(10, (teamBRating - teamARating) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (teamARating - teamBRating) / 400));

    // Actual scores (1 for win, 0 for loss)
    const actualA = match.winner_team === 'team_a' ? 1 : 0;
    const actualB = match.winner_team === 'team_b' ? 1 : 0;

    // Update ratings for each player
    const ratingUpdates = [];

    for (const participant of participants) {
      const currentRating = participant.ratings?.rating || 1200;
      const gamesPlayed = (participant.ratings?.games_played || 0) + 1;

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
      const ratingChange = Math.round(kFactor * (actual - expected));

      const newRating = Math.max(100, currentRating + ratingChange); // Floor at 100

      ratingUpdates.push({
        userId: participant.user_id,
        oldRating: currentRating,
        newRating,
        change: ratingChange,
        gamesPlayed,
      });

      // Update rating in database
      await supabaseClient
        .from('ratings')
        .update({
          rating: newRating,
          games_played: gamesPlayed,
        })
        .eq('user_id', participant.user_id);
    }

    // Update win/loss counts in profiles
    for (const participant of participants) {
      if (participant.result === 'win') {
        await supabaseClient.rpc('increment_wins', { user_id: participant.user_id });
      } else if (participant.result === 'loss') {
        await supabaseClient.rpc('increment_losses', { user_id: participant.user_id });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Ratings updated successfully',
        updates: ratingUpdates,
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
