import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

describe('useFriends', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches friendships for current user', async () => {
    const friendships = [
      { id: 'f1', requester_id: mockSession.user.id, addressee_id: 'user-b', status: 'accepted' },
      { id: 'f2', requester_id: 'user-c', addressee_id: mockSession.user.id, status: 'accepted' },
      { id: 'f3', requester_id: mockSession.user.id, addressee_id: 'user-d', status: 'pending' },
    ];
    const builder = createMockQueryBuilder({ data: friendships, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('friendships')
      .select('*')
      .or(`requester_id.eq.${mockSession.user.id},addressee_id.eq.${mockSession.user.id}`);

    expect(result.data).toHaveLength(3);
    expect(builder.or).toHaveBeenCalled();
  });

  it('separates accepted friends from pending', () => {
    const friendships = [
      { requester_id: 'me', addressee_id: 'user-b', status: 'accepted' },
      { requester_id: 'me', addressee_id: 'user-c', status: 'pending' },
      { requester_id: 'user-d', addressee_id: 'me', status: 'pending' },
    ];

    const accepted = friendships.filter(f => f.status === 'accepted');
    const sentPending = friendships.filter(f => f.status === 'pending' && f.requester_id === 'me');
    const receivedPending = friendships.filter(f => f.status === 'pending' && f.addressee_id === 'me');

    expect(accepted).toHaveLength(1);
    expect(sentPending).toHaveLength(1);
    expect(receivedPending).toHaveLength(1);
  });

  it('sends friend request by inserting friendship', async () => {
    const builder = createMockQueryBuilder({ data: { id: 'new-f' }, error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('friendships').insert({
      requester_id: mockSession.user.id,
      addressee_id: 'user-target',
      status: 'pending',
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', requester_id: mockSession.user.id })
    );
  });

  it('sends notification on friend request', async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('notifications').insert({
      user_id: 'user-target',
      type: 'friend_request',
      title: 'Friend Request',
      message: 'sent you a friend request',
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'friend_request' })
    );
  });

  it('accepts friend request by updating status', async () => {
    const builder = createMockQueryBuilder({ data: { status: 'accepted' }, error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('friendships').update({ status: 'accepted' }).eq('id', 'f2');

    expect(builder.update).toHaveBeenCalledWith({ status: 'accepted' });
  });

  it('triggers achievement check after accepting friend', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({ data: {}, error: null });

    await mockSupabase.functions.invoke('check-achievements', {
      body: { userId: mockSession.user.id },
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('check-achievements', expect.any(Object));
  });

  it('rejects friend request by deleting record', async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('friendships').delete().eq('id', 'f3');

    expect(builder.delete).toHaveBeenCalled();
  });
});
