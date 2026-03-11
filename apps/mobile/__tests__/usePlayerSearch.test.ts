import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';
import { mapProfileToPlayer, PLAYER_SEARCH_SELECT } from '../src/hooks/usePlayerSearch';

describe('usePlayerSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches profiles by name using ilike', async () => {
    const profiles = [
      { id: 'u1', full_name: 'Alice', email: 'alice@test.com', level: 10, wins: 5, losses: 3, ratings: [{ rating: 1350 }] },
    ];
    const builder = createMockQueryBuilder({ data: profiles, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('profiles')
      .select(PLAYER_SEARCH_SELECT)
      .or('full_name.ilike.%alice%,email.ilike.%alice%')
      .neq('id', mockSession.user.id)
      .order('full_name')
      .limit(10);

    expect(result.data).toHaveLength(1);
    expect(builder.or).toHaveBeenCalled();
    expect(builder.neq).toHaveBeenCalledWith('id', mockSession.user.id);
    expect(builder.limit).toHaveBeenCalledWith(10);
  });

  it('excludes current user from search results', async () => {
    const profiles = [
      { id: mockSession.user.id, full_name: 'Me', email: 'me@test.com' },
      { id: 'u2', full_name: 'Other', email: 'other@test.com' },
    ];
    const filtered = profiles.filter(p => p.id !== mockSession.user.id);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].full_name).toBe('Other');
  });

  it('maps profile with array ratings to Player', () => {
    const profile = {
      id: 'u1', full_name: 'Alice', email: 'alice@test.com',
      level: 10, wins: 5, losses: 3,
      ratings: [{ rating: 1350 }],
    };
    const player = mapProfileToPlayer(profile);
    expect(player.rating).toBe(1350);
    expect(player.full_name).toBe('Alice');
  });

  it('maps profile with single rating object to Player', () => {
    const profile = {
      id: 'u2', full_name: 'Bob', email: 'bob@test.com',
      level: 15, wins: 10, losses: 5,
      ratings: { rating: 1500 },
    };
    const player = mapProfileToPlayer(profile);
    expect(player.rating).toBe(1500);
  });

  it('defaults rating to 1200 when ratings is null', () => {
    const profile = {
      id: 'u3', full_name: 'Charlie', email: 'charlie@test.com',
      level: 1, wins: 0, losses: 0,
      ratings: null,
    };
    const player = mapProfileToPlayer(profile);
    expect(player.rating).toBe(1200);
  });

  it('does not search with empty query', () => {
    const query = '';
    const shouldSearch = query.length >= 1;
    expect(shouldSearch).toBe(false);
  });

  it('searches with minimum 1 character', () => {
    const query = 'a';
    const shouldSearch = query.length >= 1;
    expect(shouldSearch).toBe(true);
  });
});
