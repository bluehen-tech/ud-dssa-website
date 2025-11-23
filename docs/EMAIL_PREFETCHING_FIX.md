# Email Prefetching Fix for Magic Links

## Problem: "otp_expired" Error

You're getting this error:
```
access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

This happens when:
1. **Email prefetching** - Email providers (Gmail, Outlook, Microsoft Defender) automatically prefetch links in emails for security scanning
2. The prefetch consumes the token_hash before the user clicks
3. When the user actually clicks, the token is already used/expired

## Solution: Use Two-Step Confirmation

According to [Supabase documentation](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching), there are two options:

### Option 1: Use OTP Instead of Direct Link (Recommended)

Instead of a direct link, send a 6-digit code that the user enters manually:

**Email Template:**
```html
<h2>Log in to Blue Hen DSSA</h2>
<p>Your secure login code is:</p>
<p style="font-size: 24px; font-weight: bold;">{{ .Token }}</p>
<p>Enter this code on the login page to complete your sign-in.</p>
<p>This code expires in 1 hour.</p>
```

**Login Page:** Add a code input field and use `verifyOtp()` with the code.

### Option 2: Two-Step Link (Current Approach - Needs Fix)

Use a link that goes to an intermediate page, then the user clicks a button to confirm:

**Email Template:**
```html
<h2>Log in to Blue Hen DSSA</h2>
<p>Your secure login link is ready:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}">
    Click here to log in
  </a>
</p>
<p>If you didn't request this link, you can ignore this email.</p>
```

**Note:** The `/auth/confirm` route already handles this, but we need to ensure the template uses the correct URL format.

## Current Issue: Template Syntax

The `replace` function might not work in Supabase's Go templates. Let's use a simpler approach:

### Simple Template (Works with SiteURL)

```html
<h2>Log in to Blue Hen DSSA</h2>
<p>Your secure login link is ready:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}">
    {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
  </a>
</p>
<p>If you didn't request this link, you can ignore this email.</p>
```

**For Development:** Set Site URL to `http://localhost:3001` in Supabase Dashboard
**For Production:** Set Site URL to `https://bluehen-dssa.org` in Supabase Dashboard

## Alternative: Extract Base URL from RedirectTo

If you want to use `{{ .RedirectTo }}` but Go templates don't support `replace`, you might need to:

1. Change your `emailRedirectTo` to point directly to `/auth/confirm` with a query param
2. Or use a different template approach

## Quick Fix: Check Token Expiration

1. **Check when the email was sent** - Magic links expire after 1 hour
2. **Check if link was already clicked** - Tokens are one-time use
3. **Check email prefetching** - Look at server logs to see if there were multiple requests

## Recommended Solution

For now, use the simple template with `{{ .SiteURL }}` and manually change it in Supabase Dashboard when switching environments. This is the most reliable approach until we can verify Go template function support.

