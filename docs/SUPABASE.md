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

#### Email Templates (6-digit code / OTP)

Members sign in with a **6-digit code**, not a magic link. Link-based auth emails were
being flagged by spam filters (and UD's mail gateway pre-fetches links, which can
consume the one-time token before the member clicks it). The `/login` page calls
`supabase.auth.signInWithOtp({ shouldCreateUser: true })` and then
`verifyOtp({ type: 'email' })`.

**Important: Supabase uses two different templates for this one flow.**

| Member state | Template used (Dashboard → Authentication → Email Templates) |
|---|---|
| **New member** (first sign-in; account is created) | **Confirm signup** |
| **Returning member** | **Magic Link** |

If only the *Magic Link* template is updated, returning members get a code but brand-new
members get a link they can't use on the code-entry screen. **Both templates must render
`{{ .Token }}` and must not contain `{{ .ConfirmationURL }}` or a `token_hash` link.**

##### Step-by-step

1. Supabase Dashboard → your project → **Authentication** → **Email Templates**.
2. Open **Confirm signup**:
   - Subject: `Your Blue Hen DSSA sign-in code: {{ .Token }}`
   - Body: paste the template below.
   - Save.
3. Open **Magic Link**:
   - Subject: `Your Blue Hen DSSA sign-in code: {{ .Token }}`
   - Body: paste the same template below.
   - Save.
4. **Authentication** → **Providers** → **Email**: confirm **Enable Email provider** is on and
   **Confirm email** is on (this is what routes new users through *Confirm signup*).
   Leave **Secure email change** as-is.
5. Test with an `@udel.edu` address that has **never** signed in, then again with one that has.
   Both emails must show a 6-digit code and no link.

##### Template (use for BOTH "Confirm signup" and "Magic Link")

```html
<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
  <h2 style="color: #1B365D; margin: 0 0 12px;">Your Blue Hen DSSA sign-in code</h2>
  <p style="margin: 0 0 16px;">Enter this code on the sign-in page to continue:</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 0 0 16px;">
    {{ .Token }}
  </p>
  <p style="margin: 0 0 8px;">This code expires in 1 hour and can only be used once.</p>
  <p style="margin: 0; color: #555;">If you didn't request this, you can ignore this email. No one can sign in without the code.</p>
</div>
```

Why this template is spam-filter friendly:
- No hyperlinks, no tracking pixels, no images.
- Short, plain subject that includes the code (helps on lock screens and in Outlook preview).
- Plain inline styles only.

Do **not** add a "click here" fallback link to these templates; a single link is enough to
reintroduce link pre-fetching and the spam-score penalty.

##### Code expiry

`{{ .Token }}` expiry is controlled by **Authentication** → **Providers** → **Email** →
**Email OTP Expiration** (default 3600 s). If you change it, update the "expires in" text in
the template above.

##### Deliverability checklist (Resend SMTP)

Supabase sends auth email through the custom SMTP configured at **Project Settings** →
**Authentication** → **SMTP Settings** (Resend). The From domain matters more to spam filters
than the email body does:

1. In [Resend → Domains](https://resend.com/domains), the domain used in the SMTP
   **Sender email** (e.g. `bluehen-dssa.org`) must show **Verified** with all DNS records
   (DKIM, SPF/Return-Path, and ideally DMARC) green. Do not send from a Gmail/Outlook
   address or from Resend's `onboarding@resend.dev`.
2. Sender email should be a real mailbox or alias on that domain
   (e.g. `no-reply@bluehen-dssa.org` with `RESEND_REPLY_TO` pointing at an officer inbox),
   and **Sender name** should be `Blue Hen DSSA`.
3. Add a DMARC record if missing: `_dmarc.bluehen-dssa.org TXT "v=DMARC1; p=none; rua=mailto:<officer email>"`.
4. Use the same verified domain for member newsletters (`RESEND_FROM_*` in Vercel env) so
   the domain builds one consistent reputation.
5. Run a test send through [mail-tester.com](https://www.mail-tester.com) and aim for 9+/10.

##### Legacy: magic-link handler

`src/app/auth/confirm/route.ts` still exists and will exchange a `token_hash` link if one is
ever sent, so an accidentally un-updated template fails gracefully rather than 404ing. It is
not part of the normal sign-in flow and can be removed once both templates are confirmed to
be code-only in production.

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

