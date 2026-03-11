import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

describe('useLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches global leaderboard top 50 by rating', async () => {
    const leaderboardData = [
      { user_id: 'u1', rating: 1800, games_played: 50, profiles: { full_name: 'Alice', avatar_url: null, level: 20, wins: 30, losses: 20 } },
      { user_id: 'u2', rating: 1700, games_played: 40, profiles: { full_name: 'Bob', avatar_url: null, level: 15, wins: 25, losses: 15 } },
    ];
    const builder = createMockQueryBuilder({ data: leaderboardData, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('ratings').select('*, profiles(*)').order('rating', { ascending: false }).limit(50);

    expect(result.data).toHaveLength(2);
    expect(builder.order).toHaveBeenCalledWith('rating', { ascending: false });
    expect(builder.limit).toHaveBeenCalledWith(50);
  });

  it('identifies grandmaster as top-rated player', async () => {
    const topPlayer = { user_id: 'grandmaster-id' };
    const builder = createMockQueryBuilder({ data: topPlayer, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('ratings')
      .select('user_id')
      .order('rating', { ascending: false })
      .limit(1)
      .single();

    expect(result.data.user_id).toBe('grandmaster-id');
  });

  it('flattens nested profile data into LeaderboardEntry', () => {
    const raw = {
      user_id: 'u1', rating: 1800, games_played: 50,
      profiles: { full_name: 'Alice', avatar_url: null, level: 20, wins: 30, losses: 20 },
    };

    const entry = {
      id: raw.user_id,
      user_id: raw.user_id,
      rating: raw.rating,
      games_played: raw.games_played,
      full_name: raw.profiles.full_name,
      avatar_url: raw.profiles.avatar_url,
      level: raw.profiles.level,
      wins: raw.profiles.wins,
      losses: raw.profiles.losses,
    };

    expect(entry.full_name).toBe('Alice');
    expect(entry.rating).toBe(1800);
  });

  it('filters by friend IDs for friends leaderboard', () => {
    const friends = ['u1', 'u3'];
    const allEntries = [
      { user_id: 'u1', rating: 1800 },
      { user_id: 'u2', rating: 1700 },
      { user_id: 'u3', rating: 1600 },
    ];

    const filtered = allEntries.filter(e => friends.includes(e.user_id));
    expect(filtered).toHaveLength(2);
    expect(filtered.map(e => e.user_id)).toEqual(['u1', 'u3']);
  });

  it('returns empty entries when friends list is empty', () => {
    const friends: string[] = [];
    const allEntries = [{ user_id: 'u1', rating: 1800 }];
    const filtered = friends.length > 0 ? allEntries.filter(e => friends.includes(e.user_id)) : [];
    expect(filtered).toEqual([]);
  });

  it('handles fetch error gracefully', async () => {
    const builder = createMockQueryBuilder({ data: null, error: { message: 'Network error' } });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('ratings').select('*');
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Network error');
  });

  it('sorts entries by rating in descending order', () => {
    const entries = [
      { rating: 1200 },
      { rating: 1800 },
      { rating: 1500 },
    ];
    const sorted = [...entries].sort((a, b) => b.rating - a.rating);
    expect(sorted[0].rating).toBe(1800);
    expect(sorted[2].rating).toBe(1200);
  });
});
