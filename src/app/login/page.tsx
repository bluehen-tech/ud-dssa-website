"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// Passwordless sign-in via 6-digit email code (OTP).
//
// We deliberately do NOT use magic links: UD's mail gateway rewrites/pre-fetches
// links and spam filters score link-heavy auth emails poorly, which caused
// first-time members to never receive a usable sign-in email.
//
// Supabase sends the code using TWO different Dashboard templates depending on
// whether the user already exists:
//   - new user      -> Authentication -> Email Templates -> "Confirm signup"
//   - existing user -> Authentication -> Email Templates -> "Magic Link"
// BOTH templates must render {{ .Token }} (and no confirmation link) for this
// page to work. See docs/SUPABASE.md.

const ALLOWED_EMAIL_DOMAIN = '@udel.edu';
const RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_REDIRECT = '/opportunities';

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
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={index === 0}
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-primary focus:border-blue-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const redirectParam = searchParams.get('redirect');
  const nextUrl = redirectParam || DEFAULT_REDIRECT;

  // Auto-redirect if user is logged in
  useEffect(() => {
    if (session) {
      const timer = setTimeout(() => {
        window.location.href = nextUrl;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session, nextUrl]);

  // Surface errors passed back from server-side auth handlers (e.g. /auth/callback)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateEmail = (value: string): boolean => {
    return value.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
  };

  const sendCode = async (): Promise<boolean> => {
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Creates the account on first sign-in. Supabase will use the
        // "Confirm signup" template for new users and "Magic Link" for
        // returning users; both must contain {{ .Token }}.
        shouldCreateUser: true,
      },
    });

    if (signInError) {
      console.error('[login] signInWithOtp failed:', signInError.message);
      setError(signInError.message || 'Failed to send verification code. Please try again.');
      return false;
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(trimmed)) {
      setError(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
      return;
    }
    setEmail(trimmed);

    setIsLoading(true);
    const ok = await sendCode();
    setIsLoading(false);

    if (ok) {
      setOtpCode('');
      setOtpSent(true);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading || isVerifying) return;
    setError('');
    setInfo('');
    setOtpCode('');
    setIsLoading(true);
    const ok = await sendCode();
    setIsLoading(false);
    if (ok) {
      setInfo(`A new code was sent to ${email}. Only the newest code will work.`);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');
    setInfo('');

    try {
      const supabase = createClient();
      const { data: { session: newSession }, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (verifyError) {
        console.error('[login] verifyOtp failed:', verifyError.message);
        const msg = verifyError.message || '';
        if (/expired|invalid/i.test(msg)) {
          setError('That code is invalid or has expired. Request a new code and try again.');
        } else {
          setError(msg || 'Invalid code. Please try again.');
        }
        setIsVerifying(false);
        return;
      }

      if (newSession) {
        // Defense in depth: domain is also enforced in middleware.ts
        const userEmail = newSession.user.email;
        if (!userEmail || !validateEmail(userEmail)) {
          await supabase.auth.signOut();
          setError(`Invalid email domain. Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed.`);
          setIsVerifying(false);
          return;
        }

        setTimeout(() => {
          window.location.href = nextUrl;
        }, 1000);
      } else {
        setError('Sign-in did not complete. Please request a new code.');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error('[login] unexpected error during verifyOtp:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsVerifying(false);
    }
  };

  // If user is already logged in, show logged-in message
  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-blue-primary mb-2 text-center">
            Successfully Signed In
          </h1>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm text-center">
                <strong>You are now logged in.</strong>
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
                Continue to {redirectParam ? 'your destination' : 'Opportunities'} →
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
          Enter your UD email to receive a 6-digit verification code. No password needed.
        </p>

        {otpSent ? (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm text-center">
                <strong>Code sent.</strong> Check <strong>{email}</strong> for a 6-digit code from Blue Hen DSSA.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-xs space-y-1">
              <p>
                <strong>Can&apos;t find it?</strong> Check your <strong>Junk</strong> folder and, in Outlook,
                the <strong>Other</strong> tab. Emails can take a minute to arrive.
              </p>
              <p>
                If this is your first time signing in, this email also creates your member account.
              </p>
            </div>

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

            {info && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm text-center">{info}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isVerifying || otpCode.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode('');
                  setError('');
                  setInfo('');
                }}
                disabled={isVerifying}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Change Email
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading || isVerifying}
                className="text-sm text-blue-primary hover:text-blue-800 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                {isLoading
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't get a code? Send a new one"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@udel.edu"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Only {ALLOWED_EMAIL_DOMAIN} email addresses are accepted. First time here? Entering your email creates your account.
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
              {isLoading ? 'Sending...' : 'Send Verification Code'}
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
