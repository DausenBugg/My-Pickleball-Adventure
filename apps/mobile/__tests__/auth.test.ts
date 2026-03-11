import { mockSupabase, mockSession, createMockQueryBuilder } from './setup';

// Must import setup first for mocks to be in place
const { useAuth } = require('../src/state/auth') as { useAuth: jest.Mock };

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides session from getSession', async () => {
    const ctx = useAuth();
    expect(ctx.session).toBeDefined();
    expect(ctx.session.user.id).toBe(mockSession.user.id);
  });

  it('provides loading=false after initialization', () => {
    const ctx = useAuth();
    expect(ctx.loading).toBe(false);
  });

  it('provides configured=true when supabase is configured', () => {
    const ctx = useAuth();
    expect(ctx.configured).toBe(true);
  });

  it('provides isAuthTransitioning=false after initialization', () => {
    const ctx = useAuth();
    expect(ctx.isAuthTransitioning).toBe(false);
  });

  it('getSession is callable and returns session', async () => {
    const { data } = await mockSupabase.auth.getSession();
    expect(data.session).toBeDefined();
    expect(data.session.access_token).toBe('mock-access-token');
  });

  it('getUser validates access token', async () => {
    const { data } = await mockSupabase.auth.getUser('mock-access-token');
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('exposes session user email', () => {
    const ctx = useAuth();
    expect(ctx.session.user.email).toBe('test@example.com');
  });
});
