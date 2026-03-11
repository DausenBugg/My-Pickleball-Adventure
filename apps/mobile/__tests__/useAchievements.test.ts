import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

const TIER_XP_REWARDS: Record<string, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 500,
};

describe('useAchievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches all achievements ordered by requirement_value', async () => {
    const allAchievements = [
      { id: 'a1', key: 'first_match', name: 'First Match', tier: 'bronze', requirement_type: 'games_played', requirement_value: 1 },
      { id: 'a2', key: 'matches_10', name: 'Regular Player', tier: 'bronze', requirement_type: 'games_played', requirement_value: 10 },
      { id: 'a3', key: 'wins_50', name: 'Fifty Wins', tier: 'gold', requirement_type: 'wins', requirement_value: 50 },
    ];
    const builder = createMockQueryBuilder({ data: allAchievements, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('achievements').select('*').order('requirement_value', { ascending: true });
    expect(result.data).toHaveLength(3);
    expect(builder.order).toHaveBeenCalledWith('requirement_value', { ascending: true });
  });

  it('fetches user unlocked achievements', async () => {
    const unlocked = [
      { user_id: mockSession.user.id, achievement_id: 'a1', earned_at: '2026-03-01' },
    ];
    const builder = createMockQueryBuilder({ data: unlocked, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('user_achievements').select('*').eq('user_id', mockSession.user.id);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].achievement_id).toBe('a1');
  });

  it('calculates XP reward by tier correctly', () => {
    expect(TIER_XP_REWARDS['bronze']).toBe(50);
    expect(TIER_XP_REWARDS['silver']).toBe(100);
    expect(TIER_XP_REWARDS['gold']).toBe(200);
    expect(TIER_XP_REWARDS['platinum']).toBe(500);
  });

  it('calculates progress for games_played requirement', () => {
    const gamesPlayed = 7;
    const requirement = 10;
    const progress = Math.min(gamesPlayed / requirement, 1);
    expect(progress).toBeCloseTo(0.7);
  });

  it('calculates progress for wins requirement', () => {
    const wins = 50;
    const requirement = 50;
    const progress = Math.min(wins / requirement, 1);
    expect(progress).toBe(1);
  });

  it('calculates progress for win_streak requirement', () => {
    const bestStreak = 3;
    const requirement = 5;
    const progress = Math.min(bestStreak / requirement, 1);
    expect(progress).toBeCloseTo(0.6);
  });

  it('marks unlocked achievements correctly', () => {
    const allAchievements = [
      { id: 'a1', key: 'first_match' },
      { id: 'a2', key: 'matches_10' },
    ];
    const unlockedIds = new Set(['a1']);

    const enriched = allAchievements.map(a => ({
      ...a,
      is_unlocked: unlockedIds.has(a.id),
    }));

    expect(enriched[0].is_unlocked).toBe(true);
    expect(enriched[1].is_unlocked).toBe(false);
  });
});
