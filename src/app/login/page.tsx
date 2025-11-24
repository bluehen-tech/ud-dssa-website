"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/AuthContext';
import { getBaseURL } from '@/lib/get-url';
import Link from 'next/link';

// Configuration: Choose 'otp' or 'magic-link' for authentication method
// Set to 'otp' by default to avoid spam filters flagging links
const AUTH_METHOD: 'otp' | 'magic-link' = 'otp';

// OTP Input Component
function OTPInput({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d$/.test(char) && char !== '') return;
    
    const newValue = value.split('');
    newValue[index] = char;
    const updatedValue = newValue.join('').slice(0, 6);
    onChange(updatedValue);

    // Auto-focus next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-primary focus:border-blue-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const processingAuthRef = useRef(false);

  // Auto-redirect if user is logged in
  useEffect(() => {
    if (session) {
      const redirect = searchParams.get('redirect');
      const nextUrl = redirect || '/opportunities';
      
      const timer = setTimeout(() => {
        window.location.href = nextUrl;
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [session, searchParams]);

  useEffect(() => {
    const supabase = createClient();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 LOGIN PAGE MOUNTED - CHECKING AUTH STATE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 Current URL:', window.location.href);
    console.log('📍 Pathname:', window.location.pathname);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    console.log('🔗 Hash fragment:', window.location.hash || '(none)');

    // Check for error in URL params
    const errorParam = searchParams.get('error');
    if (errorParam) {
      console.warn('⚠️ Error parameter detected in URL:', errorParam);
      setError(decodeURIComponent(errorParam));
      return;
    }

    // Check if we're processing a magic link
    // This app uses PKCE flow - magic links redirect to /auth/confirm?token_hash=...
    // The /auth/confirm route handles the token exchange and redirects back here
    // We also check for hash fragments in case of implicit flow fallback
    const hasHash = typeof window !== 'undefined' && window.location.hash;
    
    if (hasHash && !processingAuthRef.current) {
      processingAuthRef.current = true;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 HASH FRAGMENT DETECTED (Implicit Flow Fallback)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 Hash:', window.location.hash.substring(0, 50) + '...');
      console.log('💡 Note: This app uses PKCE flow, but hash fragment detected');
      console.log('💡 Supabase will automatically process the hash');
      console.log('⏳ Waiting for Supabase to process hash and fire SIGNED_IN event...');

      // Supabase automatically processes the hash and fires auth state change
      // We just need to listen for the SIGNED_IN event
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔔 AUTH STATE CHANGE EVENT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📅 Event:', event);
        console.log('👤 Session user:', session?.user?.email || 'N/A');
        console.log('🆔 Session user ID:', session?.user?.id || 'N/A');
        console.log('⏰ Session expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A');
        console.log('📦 Full session:', session);

        if (event === 'SIGNED_IN' && session) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ SIGNED_IN EVENT RECEIVED');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('👤 User email:', session.user.email);
          console.log('🆔 User ID:', session.user.id);

          // Verify email domain (@udel.edu only)
          const userEmail = session.user.email;
          if (!userEmail || !userEmail.endsWith('@udel.edu')) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ EMAIL DOMAIN VALIDATION FAILED');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('📧 Email:', userEmail);
            console.error('🚨 Expected domain: @udel.edu');
            console.error('🔄 Signing out user...');
            
            await supabase.auth.signOut();
            setError('Invalid email domain. Only @udel.edu emails are allowed.');
            subscription.unsubscribe();
            return;
          }

          console.log('✅ Email domain validation passed');

          // Clear the hash from URL (Supabase has already processed it)
          const oldUrl = window.location.href;
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          console.log('🧹 Cleared hash from URL');
          console.log('   Old URL:', oldUrl);
          console.log('   New URL:', window.location.href);

          // Get redirect destination
          const redirect = searchParams.get('redirect');
          const nextUrl = redirect || '/opportunities';

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔄 PREPARING REDIRECT');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎯 Redirect destination:', nextUrl);
          console.log('⏳ Waiting 2 seconds to ensure session is fully set...');

          // Redirect after a brief moment to ensure session is fully set
          // The AuthContext will update the session state, which will trigger the UI to show logged-in message
          setTimeout(() => {
            console.log('🚀 Executing redirect to:', nextUrl);
            subscription.unsubscribe();
            window.location.href = nextUrl;
          }, 2000); // Brief delay to show logged-in message
        }

        if (event === 'SIGNED_OUT') {
          console.log('👋 SIGNED_OUT event received');
          processingAuthRef.current = false;
        }
      });

      // Cleanup subscription if component unmounts
      return () => {
        console.log('🧹 Cleaning up auth state change subscription');
        subscription.unsubscribe();
      };
    } else {
      console.log('ℹ️ No hash fragment detected - normal login page load');
      console.log('💡 User will need to request a magic link');
    }
  }, [searchParams, router]);

  const validateEmail = (email: string): boolean => {
    return email.endsWith('@udel.edu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    
    const methodName = AUTH_METHOD === 'otp' ? 'OTP CODE' : 'MAGIC LINK';
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔐 ${methodName} REQUEST STARTED`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔧 Auth method:', AUTH_METHOD);
    
    setError('');
    setIsSuccess(false);
    setOtpSent(false);

    // Client-side validation
    if (!email) {
      console.warn('⚠️ Validation failed: Email is empty');
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      console.warn('⚠️ Validation failed: Invalid email domain', { email });
      setError('Only @udel.edu email addresses are allowed');
      return;
    }

    console.log('✅ Client-side validation passed');
    console.log('📧 Email:', email);
    console.log('🌐 Current origin:', window.location.origin);
    console.log('📍 Current path:', window.location.pathname);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const baseURL = getBaseURL();
      const redirect = searchParams.get('redirect');
      
      // For magic link, we need redirect URL. For OTP, it's not needed.
      const redirectUrl = AUTH_METHOD === 'magic-link' ? baseURL : undefined;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 CALLING supabase.auth.signInWithOtp()');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', email);
      console.log('🔧 Auth method:', AUTH_METHOD);
      if (AUTH_METHOD === 'magic-link') {
        console.log('🌐 Base URL:', baseURL);
        console.log('🔗 emailRedirectTo:', redirectUrl);
        console.log('🔧 Flow type: PKCE (configured in supabase-browser.ts)');
        console.log('💡 Template will use: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email');
      } else {
        console.log('💡 OTP mode: Email template should include {{ .Token }}');
      }
      console.log('👤 shouldCreateUser: true');
      
      const requestStartTime = Date.now();
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          ...(redirectUrl && { emailRedirectTo: redirectUrl }),
          shouldCreateUser: true,
        },
      });
      const requestDuration = Date.now() - requestStartTime;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 RESPONSE RECEIVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏱️ Request duration:', requestDuration, 'ms');
      console.log('📦 Response data:', data);
      console.log('❌ Response error:', signInError);

      if (signInError) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ SIGN IN ERROR');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🚨 Error code:', signInError.status || 'N/A');
        console.error('🚨 Error message:', signInError.message);
        console.error('🚨 Full error object:', JSON.stringify(signInError, null, 2));
        
        setError(signInError.message || `Failed to send ${AUTH_METHOD === 'otp' ? 'OTP code' : 'magic link'}. Please try again.`);
        setIsLoading(false);
        return;
      }

      const totalDuration = Date.now() - startTime;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ ${methodName} SENT SUCCESSFULLY`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏱️ Total duration:', totalDuration, 'ms');
      console.log('📧 Email sent to:', email);
      
      if (AUTH_METHOD === 'otp') {
        console.log('💡 Next steps:');
        console.log('   1. Check email inbox (and spam folder)');
        console.log('   2. Enter the 6-digit code from the email');
        console.log('   3. Code will be verified to create session');
      } else {
        console.log('🔗 Magic link will redirect to:', redirectUrl);
        console.log('💡 Next steps:');
        console.log('   1. Check email inbox (and spam folder)');
        console.log('   2. Click the magic link in the email');
        console.log('   3. Link will open /auth/confirm?token_hash=...');
        console.log('   4. Server will exchange token_hash for session');
      }
      console.log('   5. You will be redirected to:', redirect || '/opportunities');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (AUTH_METHOD === 'otp') {
        setOtpSent(true);
      } else {
        setIsSuccess(true);
      }
      setIsLoading(false);

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
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const supabase = createClient();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 VERIFYING OTP CODE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', email);
      console.log('🔢 Code:', otpCode);
      
      const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (verifyError) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ OTP VERIFICATION ERROR');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🚨 Error:', verifyError);
        console.error('🚨 Error message:', verifyError.message);
        
        setError(verifyError.message || 'Invalid code. Please try again.');
        setIsVerifying(false);
        return;
      }

      if (session) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ OTP VERIFIED SUCCESSFULLY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 User:', session.user.email);
        console.log('🆔 User ID:', session.user.id);

        // Verify email domain (@udel.edu only)
        const userEmail = session.user.email;
        if (!userEmail || !userEmail.endsWith('@udel.edu')) {
          console.error('❌ EMAIL DOMAIN VALIDATION FAILED');
          await supabase.auth.signOut();
          setError('Invalid email domain. Only @udel.edu emails are allowed.');
          setIsVerifying(false);
          return;
        }

        // Redirect after successful verification
        const redirect = searchParams.get('redirect');
        const nextUrl = redirect || '/opportunities';
        
        console.log('🔄 Redirecting to:', nextUrl);
        setTimeout(() => {
          window.location.href = nextUrl;
        }, 1000);
      }
    } catch (err) {
      console.error('❌ UNEXPECTED ERROR DURING OTP VERIFICATION');
      console.error('🚨 Error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsVerifying(false);
    }
  };

  // If user is already logged in, show logged-in message
  if (session) {
    const redirect = searchParams.get('redirect');
    const nextUrl = redirect || '/opportunities';

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-blue-primary mb-2 text-center">
            Successfully Signed In
          </h1>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm text-center">
                <strong>✅ You are now logged in!</strong>
              </p>
              <p className="text-green-700 text-sm text-center mt-2">
                Signed in as: <strong>{session.user.email}</strong>
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-xs text-center">
                Redirecting you to your destination...
              </p>
            </div>
            <div className="text-center">
              <Link
                href={nextUrl}
                className="text-sm text-blue-primary hover:text-blue-800 hover:underline"
              >
                Continue to {redirect ? 'your destination' : 'Opportunities'} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-primary mb-2 text-center">
          Sign In
        </h1>
        <p className="text-gray-600 text-center mb-6">
          {AUTH_METHOD === 'otp' 
            ? 'Enter your UD email to receive a verification code'
            : 'Enter your UD email to receive a magic link'}
        </p>

        {otpSent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm text-center">
                <strong>✅ Code sent!</strong> We've sent a 6-digit code to <strong>{email}</strong>.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-xs text-center">
                <strong>💡 Can't find the email?</strong> Please check your <strong>spam</strong> or <strong>junk</strong> folder.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter the 6-digit code from your email
                </label>
                <OTPInput 
                  value={otpCode} 
                  onChange={setOtpCode} 
                  disabled={isVerifying}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm text-center">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otpCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setError('');
                  }}
                  disabled={isVerifying}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Change Email
                </button>
              </div>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>✅ Check your inbox!</strong> We've sent a magic link to <strong>{email}</strong>.
                Click the link in the email to complete your sign-in.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-xs">
                <strong>💡 Can't find the email?</strong> Please check your <strong>spam</strong> or <strong>junk</strong> folder. 
                We're building our email reputation, so it may be filtered there.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-xs">
                <strong>💡 Note:</strong> The magic link will open in a new browser window/tab. 
                This is normal email behavior.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@udel.edu"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Only @udel.edu email addresses are accepted
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading 
                ? 'Sending...' 
                : AUTH_METHOD === 'otp' 
                  ? 'Send Verification Code' 
                  : 'Send Magic Link'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-blue-primary hover:text-blue-800 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto"></div>
          <p className="text-center text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
