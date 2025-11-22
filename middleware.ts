import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Protected routes (only /officers requires authentication)
  const protectedPaths = ['/officers'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Only check session for protected paths
  if (isProtectedPath) {
    // Get and refresh session if needed
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    // If we have a session, try to refresh it to ensure it's valid
    if (session) {
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        // If refresh fails, session might be invalid - continue to check
        console.error('Session refresh error:', refreshError);
      }
    }

    // If accessing a protected route without a session, redirect to login
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

  // If session exists, validate it
  if (isProtectedPath && session) {
    // Check if Supabase JWT has expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at <= now) {
      await supabase.auth.signOut();
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'Session expired. Please sign in again.');
      return NextResponse.redirect(redirectUrl);
    }

    // Verify email is @udel.edu
    const userEmail = session.user.email;
    if (!userEmail || !userEmail.endsWith('@udel.edu')) {
      await supabase.auth.signOut();
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'Invalid email domain');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

