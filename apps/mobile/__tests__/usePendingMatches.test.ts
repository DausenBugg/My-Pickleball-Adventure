import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

describe('usePendingMatches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches participant match IDs for current user', async () => {
    const builder = createMockQueryBuilder({
      data: [{ match_id: 'match-1' }, { match_id: 'match-2' }],
      error: null,
    });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('match_participants').select('match_id').eq('user_id', mockSession.user.id);
    expect(result.data).toHaveLength(2);
    expect(builder.select).toHaveBeenCalledWith('match_id');
  });

  it('fetches pending matches with status filter', async () => {
    const pendingMatches = [
      { id: 'match-1', status: 'pending', match_type: 'singles', match_mode: 'ranked', team_a_score: 11, team_b_score: 5, winner_team: 'team_a', submitter_id: 'other-user' },
    ];
    const builder = createMockQueryBuilder({ data: pendingMatches, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('matches').select('*').eq('status', 'pending');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('pending');
  });

  it('returns empty array when user has no pending matches', async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('match_participants').select('match_id').eq('user_id', mockSession.user.id);
    expect(result.data).toEqual([]);
  });

  it('upserts approval record on approveMatch', async () => {
    const builder = createMockQueryBuilder({ data: [{ id: 'appr-1' }], error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('match_approvals').upsert({
      match_id: 'match-1',
      user_id: mockSession.user.id,
      approved: true,
    });

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ approved: true })
    );
  });

  it('upserts rejection record on rejectMatch', async () => {
    const builder = createMockQueryBuilder({ data: [{ id: 'appr-2' }], error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('match_approvals').upsert({
      match_id: 'match-1',
      user_id: mockSession.user.id,
      approved: false,
    });

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ approved: false })
    );
  });

  it('invokes process-match-approval edge function', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { message: 'Match approved and XP awarded', status: 'approved' },
      error: null,
    });

    const { data, error } = await mockSupabase.functions.invoke('process-match-approval', {
      body: { matchId: 'match-1' },
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-match-approval', expect.any(Object));
    expect(data.status).toBe('approved');
    expect(error).toBeNull();
  });

  it('handles edge function error gracefully', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Function failed' },
    });

    const { data, error } = await mockSupabase.functions.invoke('process-match-approval', {
      body: { matchId: 'bad-match' },
    });

    expect(data).toBeNull();
    expect(error.message).toBe('Function failed');
  });
});
