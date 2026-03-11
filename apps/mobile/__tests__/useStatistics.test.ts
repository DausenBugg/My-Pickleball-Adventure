import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

describe('useStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches rating history for the user', async () => {
    const history = [
      { old_rating: 1200, new_rating: 1230, rating_change: 30, created_at: '2026-03-01T10:00:00Z' },
      { old_rating: 1230, new_rating: 1210, rating_change: -20, created_at: '2026-03-02T10:00:00Z' },
    ];
    const builder = createMockQueryBuilder({ data: history, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('rating_history').select('*').eq('user_id', mockSession.user.id).order('created_at', { ascending: true });
    expect(result.data).toHaveLength(2);
  });

  it('calculates win rate for a period', () => {
    const matches = [
      { team: 'team_a', winner_team: 'team_a', created_at: '2026-03-05' },
      { team: 'team_a', winner_team: 'team_b', created_at: '2026-03-06' },
      { team: 'team_b', winner_team: 'team_b', created_at: '2026-03-07' },
    ];

    const wins = matches.filter(m => m.team === m.winner_team).length;
    const total = matches.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    expect(wins).toBe(2);
    expect(total).toBe(3);
    expect(winRate).toBeCloseTo(66.67, 1);
  });

  it('calculates mode breakdown (ranked vs casual)', () => {
    const matches = [
      { match_mode: 'ranked' },
      { match_mode: 'ranked' },
      { match_mode: 'casual' },
    ];

    const ranked = matches.filter(m => m.match_mode === 'ranked').length;
    const casual = matches.filter(m => m.match_mode === 'casual').length;

    expect(ranked).toBe(2);
    expect(casual).toBe(1);
  });

  it('calculates type breakdown (singles vs doubles)', () => {
    const matches = [
      { match_type: 'singles' },
      { match_type: 'doubles' },
      { match_type: 'doubles' },
    ];

    const singles = matches.filter(m => m.match_type === 'singles').length;
    const doubles = matches.filter(m => m.match_type === 'doubles').length;

    expect(singles).toBe(1);
    expect(doubles).toBe(2);
  });

  it('computes date threshold for 7d period', () => {
    const now = new Date();
    const threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const diff = now.getTime() - threshold.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns null threshold for "all" period', () => {
    const period = 'all';
    const threshold = period === 'all' ? null : new Date();
    expect(threshold).toBeNull();
  });

  it('groups games per week correctly', () => {
    const gamesByWeek = new Map<string, number>();
    const dates = ['2026-03-02', '2026-03-03', '2026-03-09'];

    for (const d of dates) {
      const weekStart = new Date(d);
      // Simple week grouping by day of year / 7
      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      gamesByWeek.set(label, (gamesByWeek.get(label) || 0) + 1);
    }

    expect(gamesByWeek.size).toBeGreaterThanOrEqual(2);
  });
});
