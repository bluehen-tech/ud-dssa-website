import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from './supabase-config';

// Singleton instance to avoid multiple GoTrueClient instances
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates a mock Supabase client for use when Supabase is not configured
 * This allows the app to run in demo/preview mode without Supabase credentials
 */
function createMockSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
      refreshSession: async () => ({
        data: { session: null },
        error: null,
      }),
      signOut: async () => ({
        error: null,
      }),
      signInWithOtp: async () => ({
        data: null,
        error: { message: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.' },
      }),
      verifyOtp: async () => ({
        data: { session: null, user: null },
        error: { message: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.' },
      }),
      onAuthStateChange: () => ({
        data: { subscription: null },
        unsubscribe: () => {},
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
        }),
        order: () => ({
          limit: async () => ({ data: [], error: null }),
          async then() { return { data: [], error: null }; },
        }),
        async then() { return { data: [], error: null }; },
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ 
            data: null, 
            error: { message: 'Supabase is not configured. Database operations are disabled in demo mode.' } 
          }),
          async then() { 
            return { 
              data: null, 
              error: { message: 'Supabase is not configured. Database operations are disabled in demo mode.' } 
            }; 
          },
        }),
        async then() { 
          return { 
            data: null, 
            error: { message: 'Supabase is not configured. Database operations are disabled in demo mode.' } 
          }; 
        },
      }),
      update: () => ({
        eq: () => ({
          select: async () => ({ data: null, error: null }),
          async then() { return { data: null, error: null }; },
        }),
      }),
      delete: () => ({
        eq: async () => ({ data: null, error: null }),
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
        download: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
        remove: async () => ({ data: null, error: null }),
        list: async () => ({ data: [], error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as any;
}

export const createClient = (): ReturnType<typeof createBrowserClient> => {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // If Supabase is not configured, return a mock client
  if (!isSupabaseConfigured()) {
    console.warn('⚠️  Supabase is not configured. Running in demo mode. Some features may not work.');
    const mockClient = createMockSupabaseClient();
    supabaseClient = mockClient;
    return mockClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create new client with proper browser configuration.
  // Sign-in is via 6-digit email code (signInWithOtp + verifyOtp) — see src/app/login/page.tsx.
  // PKCE is kept for /auth/callback code exchanges and the legacy /auth/confirm token_hash handler.
  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': 'ud-dssa-website',
      },
    },
  });

  return supabaseClient;
};
