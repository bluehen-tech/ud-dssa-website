"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { isSessionValid, setSessionStartTime, clearSessionStartTime } from '@/lib/session-utils';
import type { Session } from '@supabase/supabase-js';
import logo from '@/images/dssa-logo.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isSessionValid(session)) {
        setSessionStartTime(); // Ensure start time is set
        setSession(session);
      } else {
        // Session invalid or expired, sign out
        if (session) {
          supabase.auth.signOut();
        }
        setSession(null);
        clearSessionStartTime();
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && isSessionValid(session)) {
        setSessionStartTime(); // Set start time on login
        setSession(session);
      } else {
        // Session invalid or expired
        if (session) {
          supabase.auth.signOut();
        }
        setSession(null);
        clearSessionStartTime();
      }
    });

    // Check session validity periodically (every minute)
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !isSessionValid(session)) {
          // Session expired, sign out
          supabase.auth.signOut();
          setSession(null);
          clearSessionStartTime();
          router.push('/login?error=Session expired. Please sign in again.');
        }
      });
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearSessionStartTime();
    router.push('/');
    router.refresh();
  };

  const scrollToForm = () => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const formElement = document.getElementById('contact-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
                  <Image
                    src={logo}
                    alt="DSSA Logo"
                    fill
                    sizes="48px"
                    className="object-cover object-top"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-blue-primary leading-tight">
                    DSSA @ University of Delaware
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">
                    bluehen-dssa.org
                  </span>
                </div>
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-primary">
                Home
              </Link>
              {session && (
                <Link href="/opportunities" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-primary">
                  Opportunities
                </Link>
              )}
            </nav>
          </div>
          <div className="hidden md:flex md:items-center gap-3">
            {session ? (
              <>
                <span className="text-sm text-gray-600">
                  {session.user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-blue-primary text-sm font-medium rounded-full hover:text-blue-800 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <button
                  onClick={scrollToForm}
                  className="px-3 py-1.5 bg-blue-primary text-white text-sm font-medium rounded-full hover:bg-blue-800 transition-colors duration-200"
                >
                  Get Connected
                </button>
              </>
            )}
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-primary"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
            >
              Home
            </Link>
            {session && (
              <Link 
                href="/opportunities" 
                onClick={() => setIsMenuOpen(false)}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
              >
                Opportunities
              </Link>
            )}
            {session ? (
              <>
                <div className="block pl-3 pr-4 py-2 text-sm text-gray-600">
                  {session.user.email}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => {
                    scrollToForm();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white bg-blue-primary hover:bg-blue-800 transition-colors duration-200"
                >
                  Get Connected
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 