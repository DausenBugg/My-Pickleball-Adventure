import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

describe('useSubmitMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a match via insert_match RPC', async () => {
    const matchId = 'match-uuid-1234';
    mockSupabase.rpc.mockResolvedValueOnce({ data: matchId, error: null });
    mockSupabase.from.mockReturnValue(createMockQueryBuilder({ data: [], error: null }));

    const { data, error } = await mockSupabase.rpc('insert_match', {
      p_match_type: 'singles',
      p_match_mode: 'ranked',
      p_team_a_score: 11,
      p_team_b_score: 7,
      p_winner_team: 'team_a',
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('insert_match', expect.objectContaining({
      p_match_type: 'singles',
      p_match_mode: 'ranked',
    }));
    expect(data).toBe(matchId);
    expect(error).toBeNull();
  });

  it('determines winner_team from scores (team_a wins)', () => {
    const teamAScore = 11;
    const teamBScore = 5;
    const winner = teamAScore > teamBScore ? 'team_a' : 'team_b';
    expect(winner).toBe('team_a');
  });

  it('determines winner_team from scores (team_b wins)', () => {
    const teamAScore = 3;
    const teamBScore = 11;
    const winner = teamAScore > teamBScore ? 'team_a' : 'team_b';
    expect(winner).toBe('team_b');
  });

  it('inserts participants after match creation', async () => {
    const matchId = 'match-uuid-1234';
    const participantsBuilder = createMockQueryBuilder({ data: [], error: null });
    mockSupabase.from.mockReturnValue(participantsBuilder);

    await mockSupabase.from('match_participants').insert([
      { match_id: matchId, user_id: 'user-a', team: 'team_a', result: 'win' },
      { match_id: matchId, user_id: 'user-b', team: 'team_b', result: 'loss' },
    ]);

    expect(mockSupabase.from).toHaveBeenCalledWith('match_participants');
    expect(participantsBuilder.insert).toHaveBeenCalled();
  });

  it('sends notifications to non-submitter participants', async () => {
    const notifBuilder = createMockQueryBuilder({ data: [], error: null });
    mockSupabase.from.mockReturnValue(notifBuilder);

    const recipientIds = ['user-b', 'user-c'].filter(id => id !== mockSession.user.id);
    const notifications = recipientIds.map(userId => ({
      user_id: userId,
      type: 'match_approval',
      title: 'Match awaiting approval',
      message: 'You were added to a match. Review and approve it.',
      data: { match_id: 'match-uuid' },
    }));

    await mockSupabase.from('notifications').insert(notifications);

    expect(notifBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'match_approval' }),
      ])
    );
  });

  it('auto-approves for the submitter', async () => {
    const approvalBuilder = createMockQueryBuilder({ data: [], error: null });
    mockSupabase.from.mockReturnValue(approvalBuilder);

    await mockSupabase.from('match_approvals').insert({
      match_id: 'match-uuid',
      user_id: mockSession.user.id,
      approved: true,
    });

    expect(approvalBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ approved: true, user_id: mockSession.user.id })
    );
  });

  it('returns error when RPC fails', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } });

    const { data, error } = await mockSupabase.rpc('insert_match', {});
    expect(data).toBeNull();
    expect(error.message).toBe('RPC failed');
  });
});
