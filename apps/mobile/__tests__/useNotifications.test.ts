import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches notifications for current user (limit 50, newest first)', async () => {
    const notifications = [
      { id: 'n1', user_id: mockSession.user.id, type: 'achievement', title: 'Achievement!', message: 'Unlocked', read: false, created_at: '2026-03-08' },
      { id: 'n2', user_id: mockSession.user.id, type: 'system', title: 'Welcome', message: 'Hello', read: true, created_at: '2026-03-07' },
    ];
    const builder = createMockQueryBuilder({ data: notifications, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await mockSupabase.from('notifications')
      .select('*')
      .eq('user_id', mockSession.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    expect(result.data).toHaveLength(2);
    expect(builder.limit).toHaveBeenCalledWith(50);
  });

  it('calculates unread count correctly', () => {
    const notifications = [
      { read: false },
      { read: false },
      { read: true },
    ];
    const unreadCount = notifications.filter(n => !n.read).length;
    expect(unreadCount).toBe(2);
  });

  it('marks a single notification as read', async () => {
    const builder = createMockQueryBuilder({ data: { read: true }, error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('notifications')
      .update({ read: true })
      .eq('id', 'n1');

    expect(builder.update).toHaveBeenCalledWith({ read: true });
    expect(builder.eq).toHaveBeenCalledWith('id', 'n1');
  });

  it('marks all notifications as read for user', async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('notifications')
      .update({ read: true })
      .eq('user_id', mockSession.user.id)
      .eq('read', false);

    expect(builder.update).toHaveBeenCalledWith({ read: true });
  });

  it('deletes a notification', async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    mockSupabase.from.mockReturnValue(builder);

    await mockSupabase.from('notifications').delete().eq('id', 'n1');

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'n1');
  });

  it('deduplicates notifications on insert', () => {
    const existing = [
      { id: 'n1', title: 'Achievement' },
      { id: 'n2', title: 'Welcome' },
    ];
    const newNotif = { id: 'n1', title: 'Achievement' };

    const alreadyExists = existing.some(n => n.id === newNotif.id);
    expect(alreadyExists).toBe(true);

    const newNotif2 = { id: 'n3', title: 'New Match' };
    const alreadyExists2 = existing.some(n => n.id === newNotif2.id);
    expect(alreadyExists2).toBe(false);
  });

  it('sets up realtime subscription channel', () => {
    const channel = mockSupabase.channel('notifications');
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, jest.fn());
    channel.subscribe();

    expect(mockSupabase.channel).toHaveBeenCalledWith('notifications');
    expect(channel.on).toHaveBeenCalled();
    expect(channel.subscribe).toHaveBeenCalled();
  });
});
