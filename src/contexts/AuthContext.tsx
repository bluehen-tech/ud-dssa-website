"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { isSessionValid, setSessionStartTime, clearSessionStartTime } from '@/lib/session-utils';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  isAdmin: boolean;
  hasEmailAccess: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasEmailAccess, setHasEmailAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isMountedRef = useRef(true);
  const initializingRef = useRef(false);

  interface CachedPermissions {
    isAdmin: boolean;
    hasEmailAccess: boolean;
  }

  const getPermCacheKey = (userId: string) => `user_perms_${userId}`;

  const getCachedPermissions = (userId: string): CachedPermissions | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(getPermCacheKey(userId));
      if (!raw) {
        // Migrate legacy cache key
        const legacy = sessionStorage.getItem(`admin_status_${userId}`);
        if (legacy !== null) {
          sessionStorage.removeItem(`admin_status_${userId}`);
          const perms: CachedPermissions = { isAdmin: legacy === 'true', hasEmailAccess: false };
          sessionStorage.setItem(getPermCacheKey(userId), JSON.stringify(perms));
          return perms;
        }
        return null;
      }
      return JSON.parse(raw) as CachedPermissions;
    } catch {
      return null;
    }
  };

  const setCachedPermissions = (userId: string, perms: CachedPermissions) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(getPermCacheKey(userId), JSON.stringify(perms));
    } catch (error) {
      console.error('Error caching permissions:', error);
    }
  };

  const clearCachedPermissions = (userId?: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (userId) {
        sessionStorage.removeItem(getPermCacheKey(userId));
        sessionStorage.removeItem(`admin_status_${userId}`);
      } else {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('user_perms_') || key.startsWith('admin_status_')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Error clearing cached permissions:', error);
    }
  };

  const fetchPermissions = async (userId: string, useCache = true): Promise<CachedPermissions> => {
    const fallback: CachedPermissions = { isAdmin: false, hasEmailAccess: false };
    try {
      if (useCache) {
        const cached = getCachedPermissions(userId);
        if (cached !== null) {
          console.log('✅ Using cached permissions:', cached.isAdmin ? 'Admin' : 'Member', cached.hasEmailAccess ? '+ Email' : '');
          return cached;
        }
      }

      const supabase = createClient();

      const queryPromise = supabase
        .from('profiles')
        .select('admin_flag, email_access_flag')
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
        const cached = getCachedPermissions(userId);
        return cached ?? fallback;
      }

      const perms: CachedPermissions = {
        isAdmin: profile?.admin_flag === true,
        hasEmailAccess: profile?.admin_flag === true || profile?.email_access_flag === true,
      };
      console.log('✅ User role:', perms.isAdmin ? 'Admin' : 'Member', perms.hasEmailAccess ? '+ Email' : '');

      setCachedPermissions(userId, perms);
      return perms;
    } catch (error) {
      console.error('Error fetching permissions:', error instanceof Error ? error.message : String(error));
      const cached = getCachedPermissions(userId);
      return cached ?? fallback;
    }
  };

  // Initialize session
  const initializeSession = async () => {
    if (initializingRef.current) {
      console.log('⏭️ Session initialization already in progress, skipping...');
      return;
    }
    initializingRef.current = true;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 AUTH CONTEXT: INITIALIZING SESSION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // ALWAYS resolve loading state quickly
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        console.log('⏱️ Loading timeout reached (2s), setting isLoading to false');
        setIsLoading(false);
      }
    }, 2000); // Maximum 2 seconds before showing content

    try {
      const supabase = createClient();
      console.log('✅ Supabase client created');
      console.log('📤 Calling supabase.auth.getSession()...');
      
      const sessionStartTime = Date.now();
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      const sessionDuration = Date.now() - sessionStartTime;

      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 getSession() RESPONSE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏱️ Duration:', sessionDuration, 'ms');
      console.log('📦 Session exists:', !!currentSession);
      console.log('❌ Error:', error || 'None');

      if (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR GETTING SESSION');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🚨 Error:', error);
        console.error('🚨 Error message:', error.message);
        console.error('🚨 Full error:', JSON.stringify(error, null, 2));
        
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
          setHasEmailAccess(false);
          setIsLoading(false);
        }
        return;
      }

      if (currentSession && isSessionValid(currentSession)) {
        console.log('✅ Valid session found');
        console.log('👤 User email:', currentSession.user.email);
        console.log('🆔 User ID:', currentSession.user.id);
        console.log('⏰ Session expires at:', new Date(currentSession.expires_at * 1000).toISOString());
        
        setSessionStartTime();
        console.log('⏰ Session start time set');
        
        const userEmail = currentSession.user.email;
        if (!userEmail || !userEmail.endsWith('@udel.edu')) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ INVALID EMAIL DOMAIN');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('📧 Email:', userEmail);
          console.error('🚨 Expected: @udel.edu');
          console.error('🔄 Signing out...');
          
          await supabase.auth.signOut().catch(console.error);
          if (isMountedRef.current) {
            setSession(null);
            setIsAdmin(false);
            setHasEmailAccess(false);
            clearSessionStartTime();
          }
        } else {
          console.log('✅ Email domain validation passed');
          
          const cachedPerms = getCachedPermissions(currentSession.user.id);
          console.log('💾 Cached permissions:', cachedPerms ? (cachedPerms.isAdmin ? 'Admin' : 'Member') : 'Not cached');
          
          if (isMountedRef.current) {
            setSession(currentSession);
            if (cachedPerms) {
              setIsAdmin(cachedPerms.isAdmin);
              setHasEmailAccess(cachedPerms.hasEmailAccess);
              console.log('✅ Set permissions from cache');
            }
          }
          
          console.log('📤 Fetching fresh permissions...');
          fetchPermissions(currentSession.user.id, true).then(perms => {
            console.log('✅ Permissions fetched:', perms.isAdmin ? 'Admin' : 'Member');
            if (isMountedRef.current) {
              setIsAdmin(perms.isAdmin);
              setHasEmailAccess(perms.hasEmailAccess);
            }
          }).catch(error => {
            console.error('❌ Error fetching permissions:', error);
          });
        }
      } else {
        console.log('ℹ️ No valid session found');
        if (currentSession) {
          console.log('⚠️ Session exists but is invalid (expired?)');
          console.log('⏰ Session expires at:', new Date(currentSession.expires_at * 1000).toISOString());
          console.log('🔄 Signing out...');
          await supabase.auth.signOut().catch(console.error);
        }
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
          setHasEmailAccess(false);
          clearSessionStartTime();
        }
      }
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ EXCEPTION DURING SESSION INITIALIZATION');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🚨 Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('🚨 Error message:', error instanceof Error ? error.message : String(error));
      console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.error('🚨 Full error:', error);
      
      if (isMountedRef.current) {
        setSession(null);
        setIsAdmin(false);
        setHasEmailAccess(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        console.log('✅ Session initialization complete, isLoading set to false');
      }
      initializingRef.current = false;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
      
      setSession(null);
      setIsAdmin(false);
      setHasEmailAccess(false);
      clearSessionStartTime();
      clearCachedPermissions();
      
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error instanceof Error ? error.message : String(error));
      
      setSession(null);
      setIsAdmin(false);
      setHasEmailAccess(false);
      clearSessionStartTime();
      clearCachedPermissions();
      
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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔔 AUTH CONTEXT: AUTH STATE CHANGE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.log('📅 Event:', event);
      console.log('👤 Session user:', currentSession?.user?.email || 'N/A');
      console.log('🆔 Session user ID:', currentSession?.user?.id || 'N/A');
      console.log('⏰ Session expires at:', currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : 'N/A');
      console.log('📦 Session exists:', !!currentSession);

      if (event === 'SIGNED_OUT') {
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
          setHasEmailAccess(false);
          clearSessionStartTime();
          clearCachedPermissions();
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
              setHasEmailAccess(false);
              clearSessionStartTime();
            }
            return;
          }

          if (isMountedRef.current) {
            setSession(currentSession);

            const cachedPerms = getCachedPermissions(currentSession.user.id);
            if (cachedPerms) {
              setIsAdmin(cachedPerms.isAdmin);
              setHasEmailAccess(cachedPerms.hasEmailAccess);
            }
          }

          try {
            const perms = await fetchPermissions(currentSession.user.id, true);

            if (isMountedRef.current) {
              setIsAdmin(perms.isAdmin);
              setHasEmailAccess(perms.hasEmailAccess);
            }
          } catch (error) {
            console.error('Failed to fetch permissions:', error);
          }
        } else {
          if (isMountedRef.current) {
            setSession(null);
            setIsAdmin(false);
            setHasEmailAccess(false);
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
          setHasEmailAccess(false);
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
        hasEmailAccess,
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

