import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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
    },
  } as any;
}

export const createClient = (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If Supabase is not configured, return a mock client
  if (!isSupabaseConfigured()) {
    return {
      supabase: createMockSupabaseClient(),
      response: supabaseResponse,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, response: supabaseResponse };
};

