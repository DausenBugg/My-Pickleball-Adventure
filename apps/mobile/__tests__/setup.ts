// Jest setup: mock Supabase client and React Native modules

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Suppress __DEV__ errors
(global as any).__DEV__ = false;

// Mock expo modules
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => {});

// Helper to build chainable Supabase query mocks
export function createMockQueryBuilder(resolveWith: { data: any; error: any; count?: number }) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolveWith),
    then: (resolve: (v: any) => void) => Promise.resolve(resolveWith).then(resolve),
    maybeSingle: jest.fn().mockResolvedValue(resolveWith),
  };
  // Make the builder itself thenable so `await supabase.from(...).select(...)` works
  builder[Symbol.toStringTag] = 'Promise';
  builder.then = (onfulfilled?: any, onrejected?: any) =>
    Promise.resolve(resolveWith).then(onfulfilled, onrejected);
  builder.catch = (onrejected?: any) => Promise.resolve(resolveWith).catch(onrejected);
  return builder;
}

// Shared mock session
export const mockSession = {
  user: { id: 'user-1234-5678-abcd-ef0123456789', email: 'test@example.com' },
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
};

// Mock supabase client
export const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
  },
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
  },
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  }),
  removeChannel: jest.fn(),
};

jest.mock('../src/lib/supabase', () => ({
  supabase: mockSupabase,
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
  isSupabaseConfigured: true,
}));

jest.mock('../src/state/auth', () => ({
  useAuth: jest.fn().mockReturnValue({
    session: mockSession,
    loading: false,
    configured: true,
    isAuthTransitioning: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));
