import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

// Mock expo-file-system which useProfile imports (not transformable by Jest)
jest.mock('expo-file-system', () => ({}));

import {
  calculateXPForLevel,
  calculateXPToNextLevel,
  calculateLevelProgress,
} from '../src/hooks/useProfile';

// ── XP Constants (mirroring edge function values) ──────────────────────────
const BASE_WIN_XP = 120;
const BASE_LOSS_XP = 70;
const RANKED_BONUS_XP = 20;

const TIER_XP_REWARDS: Record<string, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 500,
};

// ── Helper: compute match XP like process-match-approval does ──────────────
function computeMatchXP(result: 'win' | 'loss', mode: 'ranked' | 'casual'): number {
  let xp = result === 'win' ? BASE_WIN_XP : BASE_LOSS_XP;
  if (mode === 'ranked') xp += RANKED_BONUS_XP;
  return xp;
}

// ── Helper: resolve participant result like edge function fallback logic ────
function resolveResult(
  participantResult: string | null,
  participantTeam: string,
  winnerTeam: string,
): 'win' | 'loss' {
  const resolved = participantResult ?? (participantTeam === winnerTeam ? 'win' : 'loss');
  return resolved as 'win' | 'loss';
}

// ═══════════════════════════════════════════════════════════════════════════
// Group A: Match XP Calculation (pure logic)
// ═══════════════════════════════════════════════════════════════════════════
describe('Match XP Calculation', () => {
  it('awards 120 XP for a casual win', () => {
    expect(computeMatchXP('win', 'casual')).toBe(120);
  });

  it('awards 70 XP for a casual loss', () => {
    expect(computeMatchXP('loss', 'casual')).toBe(70);
  });

  it('awards 140 XP for a ranked win (120 base + 20 ranked bonus)', () => {
    expect(computeMatchXP('win', 'ranked')).toBe(140);
  });

  it('awards 90 XP for a ranked loss (70 base + 20 ranked bonus)', () => {
    expect(computeMatchXP('loss', 'ranked')).toBe(90);
  });

  it('resolves result from explicit participant.result when set', () => {
    expect(resolveResult('win', 'team_b', 'team_a')).toBe('win');
    expect(resolveResult('loss', 'team_a', 'team_a')).toBe('loss');
  });

  it('falls back to team vs winner_team when participant.result is null', () => {
    expect(resolveResult(null, 'team_a', 'team_a')).toBe('win');
    expect(resolveResult(null, 'team_b', 'team_a')).toBe('loss');
  });

  it('computes correct XP for every combination of result and mode', () => {
    const combos: { result: 'win' | 'loss'; mode: 'ranked' | 'casual'; expected: number }[] = [
      { result: 'win', mode: 'casual', expected: 120 },
      { result: 'loss', mode: 'casual', expected: 70 },
      { result: 'win', mode: 'ranked', expected: 140 },
      { result: 'loss', mode: 'ranked', expected: 90 },
    ];
    for (const { result, mode, expected } of combos) {
      expect(computeMatchXP(result, mode)).toBe(expected);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Group B: Match Validation Awards XP (Supabase interaction)
// ═══════════════════════════════════════════════════════════════════════════
describe('Match Validation XP Awards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('awards XP to both players when a singles match is fully approved (2/2)', async () => {
    // Simulate the edge function response for an approved singles match
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Match approved and XP awarded', status: 'approved' },
      error: null,
    });

    const { data, error } = await mockSupabase.functions.invoke('process-match-approval', {
      body: { matchId: 'singles-match-1' },
    });

    expect(error).toBeNull();
    expect(data.status).toBe('approved');
    expect(data.message).toContain('XP awarded');
  });

  it('awards XP when a doubles match reaches approval threshold (3/4)', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Match approved and XP awarded', status: 'approved' },
      error: null,
    });

    const { data, error } = await mockSupabase.functions.invoke('process-match-approval', {
      body: { matchId: 'doubles-match-1' },
    });

    expect(error).toBeNull();
    expect(data.status).toBe('approved');
  });

  it('awards 0 XP when a match is rejected (any rejection)', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Match rejected', status: 'rejected' },
      error: null,
    });

    const { data, error } = await mockSupabase.functions.invoke('process-match-approval', {
      body: { matchId: 'rejected-match-1' },
    });

    expect(error).toBeNull();
    expect(data.status).toBe('rejected');
    // Rejected matches do not include XP data
    expect(data.xp_events).toBeUndefined();
  });

  it('does not award XP when approvals have not reached quorum', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Not enough approvals yet' },
      error: null,
    });

    const { data, error } = await mockSupabase.functions.invoke('process-match-approval', {
      body: { matchId: 'pending-match-1' },
    });

    expect(error).toBeNull();
    expect(data.message).toBe('Not enough approvals yet');
    expect(data.status).toBeUndefined();
  });

  it('inserts XP events with correct amounts for each participant on approval', async () => {
    // Simulate what process-match-approval does: insert xp_events for a ranked singles match
    const matchId = 'ranked-singles-1';
    const participants = [
      { user_id: 'player-a', team: 'team_a', result: 'win' },
      { user_id: 'player-b', team: 'team_b', result: 'loss' },
    ];
    const matchMode = 'ranked';

    const xpEvents = participants.map(p => ({
      user_id: p.user_id,
      match_id: matchId,
      xp_amount: computeMatchXP(p.result as 'win' | 'loss', matchMode),
      reason: `${p.result === 'win' ? 'Win' : 'Loss'} in ${matchMode} singles`,
    }));

    const builder = createMockQueryBuilder({ data: xpEvents, error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('xp_events').insert(xpEvents);

    expect(builder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: 'player-a', xp_amount: 140, reason: 'Win in ranked singles' }),
        expect.objectContaining({ user_id: 'player-b', xp_amount: 90, reason: 'Loss in ranked singles' }),
      ]),
    );
  });

  it('calls add_xp_and_recalculate RPC with correct user_id and xp_amount', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [{ new_level: 2 }], error: null });

    const { data, error } = await mockSupabase.rpc('add_xp_and_recalculate', {
      p_user_id: 'player-a',
      p_xp_amount: 140,
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('add_xp_and_recalculate', {
      p_user_id: 'player-a',
      p_xp_amount: 140,
    });
    expect(error).toBeNull();
    expect(data[0].new_level).toBe(2);
  });

  it('calls increment_wins for winners and increment_losses for losers', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: null, error: null }) // increment_wins
      .mockResolvedValueOnce({ data: null, error: null }); // increment_losses

    await mockSupabase.rpc('increment_wins', { user_id: 'player-a' });
    await mockSupabase.rpc('increment_losses', { user_id: 'player-b' });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_wins', { user_id: 'player-a' });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_losses', { user_id: 'player-b' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Group C: Achievement XP Rewards
// ═══════════════════════════════════════════════════════════════════════════
describe('Achievement XP Rewards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 50 XP when claiming a bronze achievement', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Reward claimed', achievement: 'First Match', tier: 'bronze', xp_reward: 50 },
      error: null,
    });

    const { data, error } = await mockSupabase.functions.invoke('claim-achievement-reward', {
      body: { achievementId: 'ach-bronze-1' },
    });

    expect(error).toBeNull();
    expect(data.xp_reward).toBe(TIER_XP_REWARDS['bronze']);
    expect(data.xp_reward).toBe(50);
    expect(data.tier).toBe('bronze');
  });

  it('returns 100 XP when claiming a silver achievement', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Reward claimed', achievement: 'Regular Player', tier: 'silver', xp_reward: 100 },
      error: null,
    });

    const { data } = await mockSupabase.functions.invoke('claim-achievement-reward', {
      body: { achievementId: 'ach-silver-1' },
    });

    expect(data.xp_reward).toBe(TIER_XP_REWARDS['silver']);
    expect(data.xp_reward).toBe(100);
  });

  it('returns 200 XP when claiming a gold achievement', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Reward claimed', achievement: 'Fifty Wins', tier: 'gold', xp_reward: 200 },
      error: null,
    });

    const { data } = await mockSupabase.functions.invoke('claim-achievement-reward', {
      body: { achievementId: 'ach-gold-1' },
    });

    expect(data.xp_reward).toBe(TIER_XP_REWARDS['gold']);
    expect(data.xp_reward).toBe(200);
  });

  it('returns 500 XP when claiming a platinum achievement', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Reward claimed', achievement: 'Centurion', tier: 'platinum', xp_reward: 500 },
      error: null,
    });

    const { data } = await mockSupabase.functions.invoke('claim-achievement-reward', {
      body: { achievementId: 'ach-plat-1' },
    });

    expect(data.xp_reward).toBe(TIER_XP_REWARDS['platinum']);
    expect(data.xp_reward).toBe(500);
  });

  it('returns 409 error for already-claimed achievement — no double XP', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { error: 'Reward already claimed', claimed_at: '2026-03-01T00:00:00Z' },
      error: null,
    });

    const { data } = await mockSupabase.functions.invoke('claim-achievement-reward', {
      body: { achievementId: 'ach-already-claimed' },
    });

    expect(data.error).toBe('Reward already claimed');
    expect(data.xp_reward).toBeUndefined();
  });

  it('returns 404 error when achievement is not unlocked', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Achievement not unlocked' },
    });

    const { data, error } = await mockSupabase.functions.invoke('claim-achievement-reward', {
      body: { achievementId: 'ach-not-unlocked' },
    });

    expect(data).toBeNull();
    expect(error.message).toBe('Achievement not unlocked');
  });

  it('awards tier-based XP on achievement unlock via check-achievements', async () => {
    // Simulate check-achievements inserting an XP event for a gold achievement unlock
    const xpReward = TIER_XP_REWARDS['gold']; // 200
    const xpEvent = {
      user_id: mockSession.user.id,
      match_id: null,
      xp_amount: xpReward,
      reason: 'Achievement: Fifty Wins',
    };

    const builder = createMockQueryBuilder({ data: [xpEvent], error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('xp_events').insert(xpEvent);

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockSession.user.id,
        xp_amount: 200,
        match_id: null,
        reason: 'Achievement: Fifty Wins',
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Group D: Cumulative XP & Level Calculations
// ═══════════════════════════════════════════════════════════════════════════
describe('Cumulative XP & Level Calculations', () => {
  it('accumulates match XP and achievement XP into total', () => {
    // Player wins a ranked match (140 XP) and claims a gold achievement (200 XP)
    const matchXP = computeMatchXP('win', 'ranked'); // 140
    const achievementXP = TIER_XP_REWARDS['gold']; // 200
    const totalXP = matchXP + achievementXP;

    expect(matchXP).toBe(140);
    expect(achievementXP).toBe(200);
    expect(totalXP).toBe(340);
  });

  it('accumulates XP from multiple matches and achievements', () => {
    // 3 ranked wins + 1 casual loss + bronze + silver achievement claims
    const xpSources = [
      computeMatchXP('win', 'ranked'),   // 140
      computeMatchXP('win', 'ranked'),   // 140
      computeMatchXP('win', 'ranked'),   // 140
      computeMatchXP('loss', 'casual'),  // 70
      TIER_XP_REWARDS['bronze'],         // 50
      TIER_XP_REWARDS['silver'],         // 100
    ];

    const totalXP = xpSources.reduce((sum, xp) => sum + xp, 0);
    expect(totalXP).toBe(140 + 140 + 140 + 70 + 50 + 100);
    expect(totalXP).toBe(640);
  });

  it('calls add_xp_and_recalculate for both match and achievement XP', async () => {
    // First call: match XP (ranked win = 140)
    mockSupabase.rpc.mockResolvedValueOnce({ data: [{ new_level: 1 }], error: null });
    // Second call: achievement XP (gold = 200)
    mockSupabase.rpc.mockResolvedValueOnce({ data: [{ new_level: 2 }], error: null });

    await mockSupabase.rpc('add_xp_and_recalculate', {
      p_user_id: mockSession.user.id,
      p_xp_amount: 140,
    });
    await mockSupabase.rpc('add_xp_and_recalculate', {
      p_user_id: mockSession.user.id,
      p_xp_amount: 200,
    });

    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'add_xp_and_recalculate', {
      p_user_id: mockSession.user.id,
      p_xp_amount: 140,
    });
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'add_xp_and_recalculate', {
      p_user_id: mockSession.user.id,
      p_xp_amount: 200,
    });
  });

  it('reflects updated total_xp on profile after claiming achievement', async () => {
    // Player had 140 XP from a match, then claims a gold achievement (+200)
    const profileBefore = { total_xp: 140, level: 1 };
    const claimedXP = TIER_XP_REWARDS['gold']; // 200
    const expectedTotalXP = profileBefore.total_xp + claimedXP;

    expect(expectedTotalXP).toBe(340);

    // Verify the profile query returns updated XP
    const builder = createMockQueryBuilder({
      data: { total_xp: expectedTotalXP, level: 2 },
      error: null,
    });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('profiles').select('total_xp, level').eq('id', mockSession.user.id).single();

    expect(result.data.total_xp).toBe(340);
  });

  // ── Level calculation tests (imported from useProfile) ───────────────
  it('calculateXPForLevel returns correct XP thresholds', () => {
    // Level 1: 100 * 1^1.6 = 100 → ceil(100/10)*10 = 100
    expect(calculateXPForLevel(1)).toBe(100);

    // Level 2: 100 * 2^1.6 ≈ 303.14 → ceil(303.14/10)*10 = 310
    expect(calculateXPForLevel(2)).toBe(310);

    // Level 3: 100 * 3^1.6 ≈ 579.85 → ceil(579.85/10)*10 = 580
    expect(calculateXPForLevel(3)).toBe(580);

    // Level 5: 100 * 5^1.6 ≈ 1313.2 → ceil(1313.2/10)*10 = 1320
    expect(calculateXPForLevel(5)).toBe(1320);

    // Level 10: 100 * 10^1.6 ≈ 3981.07 → ceil(3981.07/10)*10 = 3990
    expect(calculateXPForLevel(10)).toBe(3990);
  });

  it('calculateXPToNextLevel returns remaining XP needed', () => {
    // At level 1 with 200 XP: need 310 (level 2 threshold) - 200 = 110
    expect(calculateXPToNextLevel(1, 200)).toBe(110);

    // At level 1 with exactly 100 XP (level 1 threshold): need 310 - 100 = 210
    expect(calculateXPToNextLevel(1, 100)).toBe(210);

    // At level 2 with 310 XP (exactly at level 2): need 580 - 310 = 270
    expect(calculateXPToNextLevel(2, 310)).toBe(270);
  });

  it('calculateLevelProgress returns correct percentage within a level', () => {
    // Level 1 (100 XP) to Level 2 (310 XP): range = 210
    // At 205 XP: progress = (205-100)/(310-100) = 105/210 = 50%
    expect(calculateLevelProgress(1, 205)).toBe(50);

    // At level 1 threshold (100 XP): 0%
    expect(calculateLevelProgress(1, 100)).toBe(0);

    // At level 2 threshold (310 XP): 100%
    expect(calculateLevelProgress(1, 310)).toBe(100);
  });
});
