import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/opportunities';

  if (code) {
    const supabase = createServerComponentClient({ cookies });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
      }

      // Successfully authenticated
      // Note: Session start time will be set client-side in Header component
      // Redirect to opportunities
      return NextResponse.redirect(new URL(next, request.url));
    } catch (err) {
      console.error('Unexpected error during auth callback:', err);
      return NextResponse.redirect(new URL('/login?error=An unexpected error occurred', request.url));
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

