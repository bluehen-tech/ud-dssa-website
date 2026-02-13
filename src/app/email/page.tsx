"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  // Redirect non-admin users to home
  useEffect(() => {
    if (!isLoading && (!session || !isAdmin)) {
      router.replace('/');
    }
  }, [isLoading, session, isAdmin, router]);

  // Show loading state while checking auth or redirecting
  if (isLoading || !session || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin content
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
          <h1 className="text-4xl font-bold text-blue-primary mb-2">
            Email Management
          </h1>
          <p className="text-xl text-gray-600">
            Send and manage email communications
          </p>
        </div>

        {/* Placeholder content */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Email Features Coming Soon
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              This page will allow admins to compose and send emails to members, 
              manage email templates, and view email history.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="px-4 py-2 text-blue-primary hover:text-blue-800 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
