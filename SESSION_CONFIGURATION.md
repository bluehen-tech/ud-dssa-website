# Session Configuration Guide

## Session Duration: 4 Hours

The application enforces a **4-hour session limit** for authenticated users. This is implemented through a combination of:

1. **Client-side enforcement** - Tracks session start time in localStorage
2. **Server-side validation** - Checks Supabase JWT expiration
3. **Middleware protection** - Validates sessions on protected routes

## How It Works

### Client-Side (Browser)
- When a user logs in, the session start time is stored in `localStorage`
- The Header component checks session validity every minute
- If the session is older than 4 hours, the user is automatically signed out
- Session start time is cleared on logout

### Server-Side
- The `/opportunities` page checks if the Supabase JWT has expired
- Middleware validates sessions on protected routes
- Both enforce the 4-hour limit

## Supabase Dashboard Configuration

To ensure proper session management, configure your Supabase project:

1. **JWT Expiration** (Recommended: Set to at least 4 hours)
   - Go to: **Authentication** → **Settings** → **Auth**
   - Find **JWT expiry** setting
   - Set to: `14400` seconds (4 hours) or longer
   - This ensures the JWT token doesn't expire before our 4-hour limit

2. **Email Domain Restriction**
   - Go to: **Authentication** → **Settings** → **Email Auth**
   - Configure email allowlist/restrictions to only allow `@udel.edu` emails
   - This provides server-side enforcement in addition to client-side validation

## Session Lifecycle

1. **Login**: User enters `@udel.edu` email → receives magic link → clicks link → session created
2. **Active Session**: Session is valid for 4 hours from login time
3. **Expiration Check**: 
   - Client-side: Checked every minute in Header component
   - Server-side: Checked on each protected route access
4. **Expiration**: After 4 hours, user is automatically signed out and redirected to login

## Files Involved

- `src/lib/session-utils.ts` - Session validation utilities
- `src/components/layout/Header.tsx` - Client-side session monitoring
- `src/app/opportunities/page.tsx` - Server-side session check
- `middleware.ts` - Edge session validation

## Testing

To test the 4-hour limit:
1. Log in to the application
2. Check browser console/localStorage for `supabase_session_start` timestamp
3. Manually adjust the timestamp in localStorage to simulate an older session
4. Navigate to a protected route - you should be signed out

## Notes

- The 4-hour limit is enforced from the time of login, not from the last activity
- Sessions are automatically refreshed by Supabase if the JWT hasn't expired
- If the Supabase JWT expires before 4 hours, the session will end early (configure JWT expiry to 4+ hours)
- Session start time is stored in browser localStorage and is cleared on logout

