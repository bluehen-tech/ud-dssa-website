# Magic Link vs OTP Verification

Based on [Supabase Documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless)

## ✅ You ARE Using Magic Links (Correct!)

### How to Tell the Difference

**Magic Links:**
- Email template contains a **clickable link**
- User clicks the link to authenticate
- Uses `{{ .TokenHash }}` or `{{ .ConfirmationURL }}` in template
- No manual code entry required

**OTP (One-Time Password):**
- Email template contains a **6-digit code** (`{{ .Token }}`)
- User manually enters the code on your website
- Requires a code input field on login page
- Uses `verifyOtp()` with `token` parameter (not `token_hash`)

### Your Current Implementation

#### ✅ Step 1: Sending (Magic Link)
```typescript
// src/app/login/page.tsx
const { data, error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: redirectUrl,
    shouldCreateUser: true,
  },
});
```
**Status:** ✅ CORRECT - This is the method for both Magic Links and OTP

#### ✅ Step 2: Email Template (Magic Link)
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Log In
</a>
```
**Status:** ✅ CORRECT - This is Magic Link format (clickable link with `{{ .TokenHash }}`)

#### ✅ Step 3: Verification (Magic Link - PKCE Flow)
```typescript
// src/app/auth/confirm/route.ts
const { data, error } = await supabase.auth.verifyOtp({
  token_hash,  // ← Using token_hash (Magic Link)
  type: 'email',
});
```
**Status:** ✅ CORRECT - Using `token_hash` is for Magic Links (PKCE flow)

### If You Were Using OTP Instead

**OTP Email Template:**
```html
<h2>One time login code</h2>
<p>Please enter this code: {{ .Token }}</p>
```

**OTP Verification:**
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',  // ← 6-digit code user entered
  type: 'email',
});
```

## Why the "otp_expired" Error?

The error name is misleading! It's not because you're using OTP - it's because:

1. **The magic link token expired** (default: 1 hour)
2. **The token was already used** (one-time use only)
3. **Email prefetching consumed it** (email providers scan links)

The error code says "otp_expired" because Supabase uses the same underlying system for both Magic Links and OTP - they're both OTP-based authentication methods, just with different user experiences.

## Verification Checklist

- [x] Using `signInWithOtp()` method ✅
- [x] Email template has clickable link ✅
- [x] Template uses `{{ .TokenHash }}` ✅
- [x] Verification uses `token_hash` parameter ✅
- [x] No manual code entry required ✅

**Conclusion:** You ARE using Magic Links correctly! The "otp_expired" error is about the token expiring, not about using the wrong method.

