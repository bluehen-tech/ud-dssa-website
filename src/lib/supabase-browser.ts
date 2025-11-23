import { createBrowserClient } from '@supabase/ssr';

// Singleton instance to avoid multiple GoTrueClient instances
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  // Create new client with proper browser configuration
  // Using PKCE flow for magic links - matches custom email template that uses token_hash
  // Email template redirects to /auth/confirm?token_hash={{ .TokenHash }}&type=email
  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // PKCE flow required for custom email template with token_hash
    },
    global: {
      headers: {
        'x-application-name': 'ud-dssa-website',
      },
    },
  });

  return supabaseClient;
};
