import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Singleton instance to avoid multiple GoTrueClient instances
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.');
    // Return a mock client to prevent crashes, but it won't work
    // This allows the app to render even if Supabase isn't configured
    supabaseClient = createSupabaseClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
    return supabaseClient;
  }

  // Create new client with proper configuration
  supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit', // Use implicit flow for magic links
    },
    global: {
      headers: {
        'x-application-name': 'ud-dssa-website',
      },
    },
  });

  return supabaseClient;
};
