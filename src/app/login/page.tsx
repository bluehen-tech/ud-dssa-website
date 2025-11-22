"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const processingAuthRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // Check for error in URL params
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    // Check if we're processing a magic link (has hash fragment)
    const hasHash = typeof window !== 'undefined' && window.location.hash;
    
    if (hasHash && !processingAuthRef.current) {
      processingAuthRef.current = true;
      console.log('🔐 Magic link detected, waiting for Supabase to process...');

      // Supabase automatically processes the hash and fires auth state change
      // We just need to listen for it
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth event:', event);

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in:', session.user.email);

          // Verify email domain
          const userEmail = session.user.email;
          if (!userEmail || !userEmail.endsWith('@udel.edu')) {
            console.error('❌ Invalid email domain:', userEmail);
            await supabase.auth.signOut();
            setError('Invalid email domain. Only @udel.edu emails are allowed.');
            subscription.unsubscribe();
            return;
          }

          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);

          // Get redirect destination
          const redirect = searchParams.get('redirect');
          const nextUrl = redirect || '/opportunities';

          console.log('🔄 Redirecting to:', nextUrl);

          // Redirect after a brief moment to ensure session is fully set
          setTimeout(() => {
            subscription.unsubscribe();
            window.location.href = nextUrl;
          }, 500);
        }

        if (event === 'SIGNED_OUT') {
          processingAuthRef.current = false;
        }
      });

      // Cleanup subscription if component unmounts
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [searchParams, router]);

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
      
      // Build redirect URL
      const redirect = searchParams.get('redirect');
      const redirectUrl = redirect 
        ? `${window.location.origin}/login?redirect=${encodeURIComponent(redirect)}`
        : `${window.location.origin}/login`;
      
      console.log('📧 Sending magic link to:', email);
      console.log('🔗 Redirect URL:', redirectUrl);
      
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        setError(signInError.message || 'Failed to send magic link. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Magic link sent successfully!');
      setIsSuccess(true);
      setIsLoading(false);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
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
          Enter your UD email to receive a magic link
        </p>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>✅ Check your inbox!</strong> We've sent a magic link to <strong>{email}</strong>.
                Click the link in the email to complete your sign-in.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-xs">
                <strong>💡 Note:</strong> The magic link will open in a new browser window/tab. 
                This is normal email behavior.
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-800 text-xs font-semibold mb-2">🔍 Debug Info:</p>
                <ul className="text-gray-700 text-xs space-y-1 list-disc list-inside">
                  <li>Check browser console (F12) for detailed logs</li>
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
