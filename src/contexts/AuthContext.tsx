"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { isSessionValid, setSessionStartTime, clearSessionStartTime } from '@/lib/session-utils';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isMountedRef = useRef(true);
  const initializingRef = useRef(false);

  // Cache key for admin status
  const getAdminCacheKey = (userId: string) => `admin_status_${userId}`;

  // Get cached admin status
  const getCachedAdminStatus = (userId: string): boolean | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(getAdminCacheKey(userId));
      return cached === 'true' ? true : cached === 'false' ? false : null;
    } catch {
      return null;
    }
  };

  // Set cached admin status
  const setCachedAdminStatus = (userId: string, isAdmin: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(getAdminCacheKey(userId), String(isAdmin));
    } catch (error) {
      console.error('Error caching admin status:', error);
    }
  };

  // Clear cached admin status
  const clearCachedAdminStatus = (userId?: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (userId) {
        sessionStorage.removeItem(getAdminCacheKey(userId));
      } else {
        // Clear all admin status caches
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('admin_status_')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Error clearing cached admin status:', error);
    }
  };

  // Fetch admin status with caching
  const fetchAdminStatus = async (userId: string, useCache = true) => {
    try {
      // Check cache first
      if (useCache) {
        const cached = getCachedAdminStatus(userId);
        if (cached !== null) {
          console.log('✅ Using cached admin status:', cached ? 'Admin' : 'Member');
          return cached;
        }
      }

      const supabase = createClient();
      
      // Add timeout to prevent infinite hanging
      const queryPromise = supabase
        .from('profiles')
        .select('admin_flag')
        .eq('id', userId)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
      );
      
      const { data: profile, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error('Error fetching profile:', error);
        // Return cached value if available, otherwise false
        const cached = getCachedAdminStatus(userId);
        return cached !== null ? cached : false;
      }
      
      const isAdmin = profile?.admin_flag === true;
      console.log('✅ User role:', isAdmin ? 'Admin' : 'Member');
      
      // Cache the result
      setCachedAdminStatus(userId, isAdmin);
      
      return isAdmin;
    } catch (error) {
      console.error('Error fetching admin status:', error instanceof Error ? error.message : String(error));
      // Return cached value if available, otherwise false
      const cached = getCachedAdminStatus(userId);
      return cached !== null ? cached : false;
    }
  };

  // Initialize session
  const initializeSession = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    // ALWAYS resolve loading state quickly
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }, 2000); // Maximum 2 seconds before showing content

    try {
      const supabase = createClient();
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout);

      if (error) {
        console.error('Error getting session:', error);
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      if (currentSession && isSessionValid(currentSession)) {
        // Valid session
        setSessionStartTime();
        
        // Verify email domain
        const userEmail = currentSession.user.email;
        if (!userEmail || !userEmail.endsWith('@udel.edu')) {
          console.warn('Invalid email domain:', userEmail);
          await supabase.auth.signOut().catch(console.error);
          if (isMountedRef.current) {
            setSession(null);
            setIsAdmin(false);
            clearSessionStartTime();
          }
        } else {
          // Check cache first for immediate admin status
          const cachedAdmin = getCachedAdminStatus(currentSession.user.id);
          
          // Set session and cached admin status immediately
          if (isMountedRef.current) {
            setSession(currentSession);
            if (cachedAdmin !== null) {
              setIsAdmin(cachedAdmin);
            }
          }
          
          // Fetch fresh admin status in background (will use cache if available)
          fetchAdminStatus(currentSession.user.id, true).then(adminStatus => {
            if (isMountedRef.current) {
              setIsAdmin(adminStatus);
            }
          }).catch(console.error);
        }
      } else {
        // Invalid or no session
        if (currentSession) {
          await supabase.auth.signOut().catch(console.error);
        }
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
          clearSessionStartTime();
        }
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      if (isMountedRef.current) {
        setSession(null);
        setIsAdmin(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      initializingRef.current = false;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const supabase = createClient();
      
      // Sign out from Supabase with local scope (current session only)
      const signOutPromise = supabase.auth.signOut({ scope: 'local' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout after 10 seconds')), 10000)
      );
      
      const { error } = await Promise.race([
        signOutPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      
      // Clear Supabase session from localStorage
      if (typeof window !== 'undefined') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          try {
            const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
            const storageKey = `sb-${projectRef}-auth-token`;
            
            localStorage.removeItem(storageKey);
            
            // Also clear any other potential Supabase keys
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') && key.includes('auth')) {
                localStorage.removeItem(key);
              }
            });
          } catch (urlError) {
            console.error('Error parsing Supabase URL:', urlError);
          }
        }
      }
      
      // Clear local state
      setSession(null);
      setIsAdmin(false);
      clearSessionStartTime();
      clearCachedAdminStatus(); // Clear all cached admin statuses
      
      // Force a hard navigation to clear any cached state
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error instanceof Error ? error.message : String(error));
      
      // Even if there's an error, try to clear local state
      setSession(null);
      setIsAdmin(false);
      clearSessionStartTime();
      clearCachedAdminStatus(); // Clear all cached admin statuses
      
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    }
  };

  // Refresh session function
  const refreshSession = async () => {
    await initializeSession();
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initialize session
    initializeSession();

    // Set up auth state listener
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change:', event);

      if (event === 'SIGNED_OUT') {
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
          clearSessionStartTime();
          clearCachedAdminStatus(); // Clear all cached admin statuses
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (currentSession && isSessionValid(currentSession)) {
          setSessionStartTime();
          
          // Verify email domain
          const userEmail = currentSession.user.email;
          if (!userEmail || !userEmail.endsWith('@udel.edu')) {
            console.warn('Invalid email domain:', userEmail);
            await supabase.auth.signOut();
            if (isMountedRef.current) {
              setSession(null);
              setIsAdmin(false);
              clearSessionStartTime();
            }
            return;
          }

          // Set session FIRST, with cached admin status if available
          if (isMountedRef.current) {
            setSession(currentSession);
            
            // Use cached admin status immediately if available
            const cachedAdmin = getCachedAdminStatus(currentSession.user.id);
            if (cachedAdmin !== null) {
              setIsAdmin(cachedAdmin);
            }
          }

          // Check admin status (async, will use cache and update if needed)
          try {
            const adminStatus = await fetchAdminStatus(currentSession.user.id, true);
            
            if (isMountedRef.current) {
              setIsAdmin(adminStatus);
            }
          } catch (error) {
            console.error('Failed to fetch admin status:', error);
            // Keep cached value if fetch fails
          }
        } else {
          if (isMountedRef.current) {
            setSession(null);
            setIsAdmin(false);
            clearSessionStartTime();
          }
        }
      }
    });

    // Periodic session validity check
    const interval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession && !isSessionValid(currentSession)) {
        console.log('Session expired');
        await supabase.auth.signOut();
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
          clearSessionStartTime();
        }
        router.push('/login?error=Session expired. Please sign in again.');
      }
    }, 60000); // Check every minute

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        isAdmin, 
        isLoading, 
        signOut,
        refreshSession 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

