"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check for error in URL params (from callback or middleware)
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const getRedirectUrl = () => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      return `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`;
    }
    return `${window.location.origin}/auth/callback`;
  };

  const validateEmail = (email: string): boolean => {
    return email.endsWith('@udel.edu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);

    // Client-side validation
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Only @udel.edu email addresses are allowed');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = getRedirectUrl();
      
      console.log('Attempting to send magic link to:', email);
      console.log('Redirect URL:', redirectUrl);
      console.log('Note: This should call /magiclink endpoint, not /otp');
      
      // Use signInWithOtp with emailRedirectTo to trigger magic link flow
      // If this calls /otp instead of /magiclink, check Supabase email template settings
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true, // Ensure user can be created if they don't exist
        },
      });
      
      console.log('API endpoint called - check Supabase logs to see if /magiclink or /otp was used');

      console.log('Sign in response:', { data, error: signInError });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError.message || 'Failed to send magic link. Please try again.');
        setIsLoading(false);
        return;
      }

      // For signInWithOtp, a successful response has null session/user - this is expected!
      // The session is only created when the user clicks the magic link in their email
      if (data && data.user === null && data.session === null && !signInError) {
        console.log('✅ OTP email sent successfully!');
        console.log('Expected response: { session: null, user: null } - this is correct!');
        console.log('The session will be created when the user clicks the magic link.');
        console.log('Check Supabase Dashboard → Authentication → Logs to verify email delivery.');
        
        setIsSuccess(true);
        setIsLoading(false);
      } else {
        // Unexpected response - log it for debugging
        console.warn('Unexpected response format:', { data, error: signInError });
        setIsSuccess(true); // Still show success if no error
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-primary mb-2 text-center">
          Sign In
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Enter your UD email to receive a one-time passcode
        </p>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>Check your inbox!</strong> We've sent a magic link to <strong>{email}</strong>.
                Click the link in the email to complete your sign-in.
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-xs font-semibold mb-2">🔍 Debug Info:</p>
                <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                  <li><strong>Expected response:</strong> session: null, user: null (this is correct!)</li>
                  <li>Session is created when you click the magic link in your email</li>
                  <li>Check browser console (F12) for detailed logs</li>
                  <li>Check Supabase Dashboard → Authentication → Logs</li>
                  <li>Verify email in spam/junk folder</li>
                  <li>Free tier limit: 3 emails/hour per address</li>
                </ul>
              </div>
            )}
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
              {isLoading ? 'Sending...' : 'Send Magic Link'}
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

