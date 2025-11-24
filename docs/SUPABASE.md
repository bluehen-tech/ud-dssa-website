# Supabase Authentication Guide

> **Single Source of Truth** - Based on [Official Supabase Documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless)

This document consolidates all Supabase authentication setup, implementation, and troubleshooting information for the UD-DSSA website.

---

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Magic Link Authentication](#magic-link-authentication)
4. [Implementation Details](#implementation-details)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses **Supabase Auth** with **passwordless email authentication** (Magic Links). Users sign in by clicking a link sent to their email address.

### Key Features

- ✅ Passwordless authentication (no passwords to remember)
- ✅ Email-based magic links
- ✅ Automatic user signup on first login
- ✅ Email domain validation (@udel.edu only)
- ✅ Session persistence across page refreshes
- ✅ Automatic token refresh

### Authentication Flow (PKCE)

1. User enters email on `/login` page
2. Client calls `supabase.auth.signInWithOtp()` with email
3. Supabase sends magic link email to user (with `token_hash` in URL)
4. User clicks link → opens in browser (may be new window/tab)
5. Browser loads `/auth/confirm?token_hash=...&type=email`
6. **Server-side `/auth/confirm` route exchanges token_hash for session** (PKCE flow)
7. User is redirected to `/login` with active session
8. Supabase fires `SIGNED_IN` event via `onAuthStateChange`
9. Application validates email domain (@udel.edu)
10. User is redirected to `/opportunities`

**Key Point:** PKCE flow uses server-side token exchange for enhanced security. The `/auth/confirm` route handles the session creation.

---

## Configuration

### 1. Supabase Dashboard Setup

#### Redirect URLs

Configure allowed redirect URLs in your Supabase project:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following to **Redirect URLs**:

**For Local Development:**
```
http://localhost:3000/**
http://localhost:3001/**
```

**For Vercel Preview Deployments:**
```
https://*-<team-or-account-slug>.vercel.app/**
```
Replace `<team-or-account-slug>` with your Vercel team/account slug, or use a wildcard pattern that matches your preview URLs.

**For Production:**
```
https://bluehen-dssa.org/login
https://bluehen-dssa.org/auth/confirm
```

**Note:** The `**` wildcard pattern allows all paths under that domain, which is useful for preview deployments.

#### Site URL

Set the **Site URL** to your primary production domain:
```
https://bluehen-dssa.org
```

**Note:** The code uses environment variables to dynamically determine the correct URL for each environment (see `src/lib/get-url.ts`).

#### Email Templates

The email template is configured in:
- **Authentication** → **Email Templates** → **Magic Link**

**This Application Supports Both Magic Links and OTP:**
This application supports both Magic Links and OTP (One-Time Password) authentication methods. According to the [Supabase documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless), `signInWithOtp()` is used for both - the difference is determined by the email template content.

**Current Default: OTP** (to avoid spam filters flagging links)

**OTP Template (Recommended - Default):**
```
<h2>Log in to Blue Hen DSSA</h2>
<p>Your one-time login code is:</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
  {{ .Token }}
</p>
<p>Enter this code on the login page to complete your sign-in.</p>
<p>This code will expire in 1 hour.</p>
<p>If you didn't request this code, you can ignore this email.</p>
```

**Magic Link Template (Alternative):**
```
<h2>Log in to Blue Hen DSSA</h2>
<p>Your secure login link is ready:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    Click here to log in
  </a>
</p>
<p>If you didn't request this link, you can ignore this email.</p>
```

**Key Points:**
- ✅ Using `signInWithOtp()` method (works for both Magic Links and OTP)
- ✅ **OTP Template:** Uses `{{ .Token }}` to display the 6-digit code (no links)
- ✅ **Magic Link Template:** Uses `{{ .TokenHash }}` (PKCE flow for Magic Links)
- ✅ **OTP:** User enters code manually in the login form
- ✅ **Magic Link:** User clicks link in email (redirects to `/auth/confirm`)
- ✅ OTP is less likely to be flagged by spam filters (no hyperlinks)
- The authentication method can be changed in `src/app/login/page.tsx` via the `AUTH_METHOD` constant
- Requires `/auth/confirm` route handler (already implemented)

**How It Works:**
- `{{ .RedirectTo }}` contains the base URL from `emailRedirectTo` (e.g., `http://localhost:3001`)
- Template appends `/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- Result: `http://localhost:3001/auth/confirm?token_hash=...&type=email` (dev)
- Result: `https://bluehen-dssa.org/auth/confirm?token_hash=...&type=email` (prod)
- Code passes just the base URL (no `/login`) to `emailRedirectTo` for simplicity

**Note:** The "otp_expired" error is misleading - it means the magic link token expired, not that you're using OTP. Magic Links and OTP share the same underlying system, but Magic Links use clickable links while OTP uses 6-digit codes.

**Alternative: Implicit Flow (Default)**
If you want to use implicit flow instead, use the default template:
```
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```
> **Note:** If switching to implicit flow, also update `src/lib/supabase-browser.ts` to remove `flowType: 'pkce'`.

### 2. Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from:
- Supabase Dashboard → **Settings** → **API**

---

## Magic Link Authentication

### How It Works

Supabase Auth provides passwordless login using Magic Links. This application uses **PKCE flow** with a custom email template, which means:

- Email template includes `token_hash` parameter in the magic link URL
- Magic links redirect to `/auth/confirm` endpoint (server-side)
- Server exchanges `token_hash` for a session using `verifyOtp()`
- User is redirected to `/login` with an active session
- More secure than implicit flow (tokens never exposed in URL)

### Client Implementation

**File:** `src/lib/supabase-browser.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // flowType defaults to 'implicit' for magic links
    },
  });
};
```

**Key Configuration:**
- `flowType: 'pkce'` - Uses PKCE flow (matches custom email template)
- `detectSessionInUrl: true` - Automatically detects hash fragments (fallback)
- `persistSession: true` - Saves session to localStorage
- `autoRefreshToken: true` - Refreshes tokens before expiration

### Sending Magic Links

**File:** `src/app/login/page.tsx`

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@udel.edu',
  options: {
    emailRedirectTo: `${window.location.origin}/login`,
    shouldCreateUser: true, // Auto-create user on first login
  },
});
```

### Handling Magic Link Redirects

**PKCE Flow (Current Implementation):**

1. User clicks magic link in email
2. Email template redirects to `/auth/confirm?token_hash=...&type=email`
3. Server-side `/auth/confirm` route exchanges token_hash for session
4. User is redirected to `/login` with active session
5. Login page detects session via `onAuthStateChange`
6. Validates email domain (@udel.edu)
7. Redirects to destination

**Fallback: Hash Fragment Detection**

The login page also handles hash fragments (for implicit flow compatibility):
- Detects hash fragment in URL (`#access_token=...`)
- Supabase JS processes the hash automatically
- Listens for `SIGNED_IN` event via `onAuthStateChange`

### Rate Limits

By default:
- Users can request a magic link **once every 60 seconds**
- Magic links expire after **1 hour**
- Free tier: **3 emails/hour per address**

These are configurable in Supabase Dashboard → **Authentication** → **Providers** → **Email**.

---

## Implementation Details

### Supabase Clients

This application uses three Supabase client configurations:

#### 1. Browser Client (`src/lib/supabase-browser.ts`)
- Used in client components
- Handles magic link authentication
- Manages session in localStorage
- Singleton pattern to avoid multiple instances

#### 2. Server Client (`src/lib/supabase-server.ts`)
- Used in server components and API routes
- Handles cookies for SSR
- Used in `/auth/callback` route (for PKCE flow)

#### 3. Middleware Client (`src/lib/supabase-middleware.ts`)
- Used in Next.js middleware
- Handles session validation for protected routes
- Refreshes sessions automatically

### Authentication Context

**File:** `src/contexts/AuthContext.tsx`

Provides centralized authentication state:
- `session` - Current user session
- `isAdmin` - Admin status from profiles table
- `isLoading` - Initialization state
- `signOut()` - Sign out function
- `refreshSession()` - Refresh session function

### Protected Routes

**File:** `middleware.ts`

Protects routes that require authentication:
- `/officers` - Requires authentication
- `/opportunities` - Public (shows sign-in prompt if not logged in)

### Email Domain Validation

All authentication flows validate that emails end with `@udel.edu`:
- Client-side validation in login form
- Server-side validation in middleware
- AuthContext validation on session initialization

---

## Database Setup

### Profiles Table

The `profiles` table tracks user information and admin status:

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  admin_flag boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile
-- SECURITY: Prevents privilege escalation
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND admin_flag = false  -- Cannot self-promote to admin
  );

-- Allow users to update their own profile
-- SECURITY: Cannot change admin_flag or email
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND admin_flag = (SELECT admin_flag FROM profiles WHERE id = auth.uid())
    AND email = (SELECT email FROM profiles WHERE id = auth.uid())
  );
```

**🔒 Security Note:** These RLS policies prevent users from promoting themselves to admin or changing their email. Only database administrators (via Supabase dashboard or service role) can modify `admin_flag` and `email` fields.

### Making a User Admin

**Via SQL:**
```sql
-- Update existing profile
UPDATE profiles
SET admin_flag = true
WHERE email = 'user@udel.edu';

-- Or insert/update
INSERT INTO profiles (id, email, admin_flag)
VALUES ('user-uuid-here', 'user@udel.edu', true)
ON CONFLICT (id) DO UPDATE 
SET admin_flag = true;
```

**Via Supabase Dashboard:**
1. Go to **Table Editor** → `profiles`
2. Find the user by email or add new row
3. Set `admin_flag` to `true`

---

## Troubleshooting

### Magic Link Not Arriving

**Check:**
1. Spam/junk folder
2. Supabase Dashboard → **Authentication** → **Users** (verify email)
3. Supabase Dashboard → **Logs** (check email delivery status)
4. Rate limits (free tier: 3 emails/hour per address)

**Solution:**
- Wait 60 seconds between requests
- Check Supabase email logs
- Verify email template is configured

### Magic Link Opens New Browser Window

**This is normal!** Email clients (Gmail, Outlook, etc.) always open links in new windows for security reasons.

**To use the original window:**
1. Right-click the magic link in email
2. Select "Copy Link Address"
3. Paste in original browser window
4. Press Enter

### Session Not Persisting

**Check:**
1. Browser console for auth errors
2. localStorage for `sb-{project-ref}-auth-token`
3. Session timeout settings (default: 1 hour, configurable)

**Solution:**
- Clear browser cache and localStorage
- Check Supabase session settings
- Verify `persistSession: true` in client config

### Admin Status Not Loading

**Symptoms:**
- Header always shows "Member" even for admin users
- Console shows query hanging

**Solution:**
1. Verify RLS policies are created (see Database Setup)
2. Check that user has a profile row
3. Verify `admin_flag` is set to `true` in database

**Create profile if missing:**
```sql
INSERT INTO profiles (id, email, admin_flag)
VALUES ('user-uuid-here', 'user@udel.edu', true)
ON CONFLICT (id) DO UPDATE 
SET admin_flag = true;
```

### Sign Out Not Working

**Solution:**
1. Clear browser cache: DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"
2. Manually clear localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### Invalid Email Domain Error

**Error:** "Only @udel.edu emails are allowed"

**Cause:** Email validation is enforced at multiple levels:
- Client-side (login form)
- Server-side (middleware)
- AuthContext (session initialization)

**Solution:** Use a valid @udel.edu email address.

---

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Passwordless Email Auth Guide](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Magic Links Guide](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase Dashboard logs
3. Check browser console for errors
4. Verify environment variables are set correctly

