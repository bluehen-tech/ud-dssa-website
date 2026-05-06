import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from './supabase-config';

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
      verifyOtp: async () => ({
        data: { session: null, user: null },
        error: { message: 'Supabase is not configured' },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
        }),
        order: async () => ({ data: [], error: null }),
        async then() { return { data: [], error: null }; },
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ 
            data: { id: 'demo-id' }, 
            error: { message: 'Supabase is not configured. Form submissions are disabled in demo mode.' } 
          }),
          async then() { 
            return { 
              data: { id: 'demo-id' }, 
              error: { message: 'Supabase is not configured. Form submissions are disabled in demo mode.' } 
            }; 
          },
        }),
        async then() { 
          return { 
            data: null, 
            error: { message: 'Supabase is not configured. Form submissions are disabled in demo mode.' } 
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
  } as any;
}

export const createClient = () => {
  // If Supabase is not configured, return a mock client
  if (!isSupabaseConfigured()) {
    return createMockSupabaseClient();
  }

  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

