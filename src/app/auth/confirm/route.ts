import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth Confirmation Handler (PKCE Flow)
 * 
 * This endpoint handles PKCE flow magic link authentication.
 * 
 * This application uses PKCE flow with a custom email template that includes:
 * {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 * 
 * Flow:
 * 1. User clicks magic link in email
 * 2. Email template redirects to this endpoint with token_hash parameter
 * 3. This endpoint exchanges token_hash for a session using verifyOtp()
 * 4. User is redirected to /login (or next parameter) with active session
 * 
 * See: https://supabase.com/docs/guides/auth/auth-email-passwordless#with-magic-link
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/opportunities';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 AUTH CONFIRMATION REQUEST (PKCE Flow)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🌐 Full URL:', requestUrl.href);
  console.log('📍 Pathname:', requestUrl.pathname);
  console.log('🔍 Search params:', {
    token_hash: token_hash ? `${token_hash.substring(0, 20)}...` : null,
    type,
    next,
  });
  console.log('🌍 Origin:', requestUrl.origin);
  console.log('👤 User-Agent:', request.headers.get('user-agent') || 'N/A');
  console.log('🔗 Referer:', request.headers.get('referer') || 'N/A');

  // Validate required parameters
  if (!token_hash || !type) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ MISSING REQUIRED PARAMETERS');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('🔑 token_hash present:', !!token_hash);
    console.error('📝 type present:', !!type);
    console.error('🔍 All search params:', Object.fromEntries(requestUrl.searchParams.entries()));
    console.error('💡 Expected: /auth/confirm?token_hash=...&type=email');
    console.error('🔄 Redirecting to /login with error...');
    
    return NextResponse.redirect(
      new URL('/login?error=Invalid confirmation link', request.url)
    );
  }

  console.log('✅ Required parameters validated');

  try {
    const supabase = createClient();
    console.log('✅ Supabase client created');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 CALLING supabase.auth.verifyOtp()');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 token_hash length:', token_hash.length);
    console.log('📝 type:', type);
    console.log('⏳ Exchanging token_hash for session...');

    const verifyStartTime = Date.now();
    // Exchange the token hash for a session (PKCE flow)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email',
    });
    const verifyDuration = Date.now() - verifyStartTime;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 verifyOtp() RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏱️ Verification duration:', verifyDuration, 'ms');
    console.log('📦 Response data:', {
      session: data.session ? {
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
        },
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
      } : null,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
      } : null,
    });
    console.log('❌ Response error:', error);

    if (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ OTP VERIFICATION ERROR');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🚨 Error status:', error.status || 'N/A');
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Full error:', JSON.stringify(error, null, 2));
      console.error('💡 Common causes:');
      console.error('   - Token hash expired (magic links expire after 1 hour)');
      console.error('   - Token hash already used (one-time use only)');
      console.error('   - Invalid token hash format');
      console.error('   - Supabase configuration issue');
      console.error('🔄 Redirecting to /login with error...');
      
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    if (!data.session) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ NO SESSION RETURNED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('📦 Full response data:', JSON.stringify(data, null, 2));
      console.error('💡 This should not happen - verifyOtp() should return a session');
      console.error('🔄 Redirecting to /login with error...');
      
      return NextResponse.redirect(
        new URL('/login?error=Failed to create session', request.url)
      );
    }

    console.log('✅ Session created successfully');
    console.log('👤 User ID:', data.session.user.id);
    console.log('📧 User email:', data.session.user.email);
    console.log('⏰ Session expires at:', new Date(data.session.expires_at * 1000).toISOString());

    // Verify email domain
    const userEmail = data.session.user.email;
    if (!userEmail || !userEmail.endsWith('@udel.edu')) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ EMAIL DOMAIN VALIDATION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('📧 Email:', userEmail);
      console.error('🚨 Expected domain: @udel.edu');
      console.error('🔄 Signing out and redirecting...');
      
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL('/login?error=Only @udel.edu emails are allowed', request.url)
      );
    }

    console.log('✅ Email domain validation passed');

    const totalDuration = Date.now() - startTime;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AUTHENTICATION SUCCESSFUL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏱️ Total duration:', totalDuration, 'ms');
    console.log('👤 Authenticated user:', userEmail);
    console.log('🎯 Redirect destination (next param):', next);
    console.log('🌐 Request URL origin:', requestUrl.origin);
    console.log('🌐 Request URL base:', request.url);

    // Get the redirect_to parameter from the original request (if provided in email template)
    // This allows the email template to specify where to redirect after authentication
    const redirectTo = requestUrl.searchParams.get('redirect_to');
    const finalRedirect = redirectTo || next;
    
    // Redirect to /login first - the login page will detect the session and redirect appropriately
    // This ensures the session is properly set in the browser before redirecting
    // The login page has logic to check for session and redirect to the destination
    const loginUrl = new URL('/login', request.url);
    
    // Always pass the next parameter as redirect query param
    // This allows the login page to know where to redirect after detecting the session
    if (finalRedirect && finalRedirect !== '/opportunities') {
      loginUrl.searchParams.set('redirect', finalRedirect);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 REDIRECTING TO LOGIN PAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Login URL:', loginUrl.href);
    console.log('🎯 Final destination (will be redirected by login page):', finalRedirect);
    console.log('💡 Flow: /auth/confirm → /login → (login detects session) →', finalRedirect);

    return NextResponse.redirect(loginUrl);

  } catch (err) {
    const totalDuration = Date.now() - startTime;
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ UNEXPECTED ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('⏱️ Duration before error:', totalDuration, 'ms');
    console.error('🚨 Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('🚨 Error message:', err instanceof Error ? err.message : String(err));
    console.error('🚨 Error stack:', err instanceof Error ? err.stack : 'N/A');
    console.error('🚨 Full error:', err);
    console.error('🔄 Redirecting to /login with error...');
    
    return NextResponse.redirect(
      new URL('/login?error=An unexpected error occurred', request.url)
    );
  }
}

