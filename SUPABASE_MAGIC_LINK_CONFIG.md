# Supabase Magic Link Configuration

## Issue Identified

Your login form is calling `/otp` endpoint (OTP codes) instead of `/magiclink` endpoint (magic links).

**From your logs:**
- Login form: `POST /otp` with `user_confirmation_requested` → No email sent
- Manual trigger: `POST /magiclink` with `user_recovery_requested` → Email sent ✅

## Root Cause

The `signInWithOtp()` method is sending OTP codes instead of magic links, even though `emailRedirectTo` is provided.

## Solution: Configure Supabase Settings

### Step 1: Check Email Template Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Check the **Magic Link** template
3. Ensure it's enabled and properly configured
4. The template should include: `{{ .ConfirmationURL }}`

### Step 2: Check Email Auth Settings

1. Go to **Authentication** → **Settings** → **Email Auth**
2. Verify these settings:
   - ✅ **Enable Email Auth** is ON
   - ✅ **Enable Email Confirmations** is configured
   - Check **Email confirmation method**:
     - Should be set to **Magic Link** (not OTP code)
     - Or allow both, but prioritize magic links

### Step 3: Check URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Verify **Site URL** is set correctly:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (for production)

### Step 4: Verify Email Provider

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Check if SMTP is configured:
   - If using Supabase's built-in email: Should work but limited
   - If using custom SMTP: Verify credentials are correct

## Alternative: Use Password Reset Flow

If magic links aren't working, you can temporarily use the password reset flow which uses `/magiclink`:

```typescript
// This uses the recovery/magic link endpoint
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
});
```

However, this is not ideal for login - it's meant for password resets.

## Recommended Fix

The issue is likely in Supabase's email template or auth settings. The `signInWithOtp()` with `emailRedirectTo` should trigger magic links, but Supabase might be configured to send OTP codes instead.

### Check These Settings:

1. **Email Templates** → **Magic Link** template exists and is enabled
2. **Email Auth Settings** → Email confirmation method is set to Magic Link
3. **URL Configuration** → Redirect URLs include your callback URL

## Testing

After updating settings:

1. Try logging in again
2. Check Supabase logs - should see `POST /magiclink` instead of `POST /otp`
3. Check your email - should receive magic link email
4. Click the link - should redirect to `/auth/callback` and create session

## If Still Not Working

If after checking all settings it still calls `/otp`:

1. Check Supabase project settings for any email-related restrictions
2. Verify your Supabase project tier (free tier has limitations)
3. Contact Supabase support with:
   - Your project reference ID
   - The log entries showing `/otp` vs `/magiclink`
   - Screenshots of your email template settings

