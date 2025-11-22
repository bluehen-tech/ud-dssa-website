import type { Session } from '@supabase/supabase-js';

/**
 * Session duration in milliseconds (4 hours)
 */
export const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

const SESSION_START_KEY = 'supabase_session_start';

/**
 * Store the session start time when user logs in
 */
export function setSessionStartTime(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }
}

/**
 * Get the session start time from localStorage
 * @returns Session start timestamp in milliseconds, or null if not found
 */
export function getSessionStartTime(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const startTime = localStorage.getItem(SESSION_START_KEY);
  return startTime ? parseInt(startTime, 10) : null;
}

/**
 * Clear the session start time (call on logout)
 */
export function clearSessionStartTime(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_START_KEY);
  }
}

/**
 * Check if a session is valid (not expired and within 4-hour limit)
 * @param session - The Supabase session to check
 * @returns true if session is valid, false otherwise
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) {
    return false;
  }

  // Check if session has expired (Supabase JWT expiration)
  const now = Date.now();
  const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
  
  if (expiresAt && now >= expiresAt) {
    return false;
  }

  // Check if session was created more than 4 hours ago
  const sessionStartTime = getSessionStartTime();
  if (sessionStartTime) {
    const sessionAge = now - sessionStartTime;
    if (sessionAge >= SESSION_DURATION_MS) {
      return false; // Session is older than 4 hours
    }
  } else {
    // If we don't have a start time, set it now (first check after login)
    setSessionStartTime();
  }

  return true;
}

/**
 * Get the time remaining until session expires (in milliseconds)
 * @param session - The Supabase session
 * @returns Time remaining in milliseconds, or 0 if expired/invalid
 */
export function getSessionTimeRemaining(session: Session | null): number {
  if (!session) {
    return 0;
  }

  const now = Date.now();
  
  // Check Supabase JWT expiration
  const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
  const jwtRemaining = expiresAt ? Math.max(0, expiresAt - now) : Infinity;
  
  // Check our 4-hour limit
  const sessionStartTime = getSessionStartTime();
  const customRemaining = sessionStartTime 
    ? Math.max(0, SESSION_DURATION_MS - (now - sessionStartTime))
    : SESSION_DURATION_MS;
  
  // Return the minimum (whichever expires first)
  return Math.min(jwtRemaining, customRemaining);
}

/**
 * Check if session should be refreshed (within 5 minutes of expiration)
 * @param session - The Supabase session
 * @returns true if session should be refreshed
 */
export function shouldRefreshSession(session: Session | null): boolean {
  if (!session) {
    return false;
  }

  const timeRemaining = getSessionTimeRemaining(session);
  const fiveMinutes = 5 * 60 * 1000;

  return timeRemaining > 0 && timeRemaining < fiveMinutes;
}

