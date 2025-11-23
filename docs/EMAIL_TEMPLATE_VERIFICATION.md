# Email Template Verification Guide

Based on [Supabase Email Template Documentation](https://supabase.com/docs/guides/local-development/customizing-email-templates#authemailtemplatemagiclink)

## ⚠️ Important: Hosted vs Local Development

**You are using a HOSTED Supabase project**, so:
- ❌ Do NOT edit `config.toml` files (that's for local development only)
- ✅ Edit templates in **Supabase Dashboard** → **Authentication** → **Email Templates**

---

## Magic Link Template Requirements

### For PKCE Flow (Your Current Setup)

Your magic link template should use `{{ .TokenHash }}` to construct the confirmation URL:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

### Key Template Variables

According to the [official documentation](https://supabase.com/docs/guides/local-development/customizing-email-templates#authemailtemplatemagiclink):

#### `{{ .TokenHash }}`
- Contains a hashed version of the token
- **Required for PKCE flow**
- Used to construct your own email link
- Example usage:
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm</a>
  ```

#### `{{ .SiteURL }}`
- Contains your application's Site URL
- Configured in: **Authentication** → **URL Configuration** → **Site URL**
- Should be: `http://localhost:3001` (dev) or `https://bluehen-dssa.org` (prod)
- **Note:** This is a static value from dashboard settings

#### `{{ .RedirectTo }}` ⭐ Recommended for Environment-Aware URLs
- Contains the redirect URL passed when `signInWithOtp()` is called
- **Environment-aware** - automatically uses the URL from your code
- Example: `http://localhost:3001/login` (dev) or `https://bluehen-dssa.org/login` (prod)
- Can be transformed in template to create confirmation URL

#### `{{ .ConfirmationURL }}` (Alternative)
- Contains the full confirmation URL (for implicit flow)
- **Do NOT use this for PKCE flow**
- Only use if switching to implicit flow

#### `{{ .Token }}` (OTP)
- Contains a 6-digit One-Time-Password
- **Not used for magic links** (only for OTP flow)

---

## Step-by-Step Template Verification

### 1. Access Email Templates

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `cweznoavmkngturboqdu`
3. Navigate to **Authentication** → **Email Templates**
4. Click on **Magic Link** template

### 2. Verify Template Content

Your template should look exactly like this:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

**Critical Checks:**
- ✅ Uses `{{ .TokenHash }}` (not `{{ .Token }}` or `{{ .ConfirmationURL }}`)
- ✅ Uses `{{ .SiteURL }}` (not hardcoded URL)
- ✅ Link points to `/auth/confirm` endpoint
- ✅ Includes `token_hash={{ .TokenHash }}` parameter
- ✅ Includes `type=email` parameter
- ✅ No typos in variable names (case-sensitive!)

### 3. Common Template Errors

#### ❌ Wrong: Using ConfirmationURL (Implicit Flow)
```html
<a href="{{ .ConfirmationURL }}">Log In</a>
```
**Problem:** This uses implicit flow, but your code expects PKCE flow

#### ❌ Wrong: Using Token (OTP)
```html
<p>Your code: {{ .Token }}</p>
```
**Problem:** This is for OTP flow, not magic links

#### ❌ Wrong: Hardcoded URL
```html
<a href="http://localhost:3001/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a>
```
**Problem:** Hardcoded URL won't work in production

#### ✅ Correct: PKCE Flow Template
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a>
```

---

## Template Syntax Validation

### Valid Template Variables for Magic Link

According to the documentation, these variables are available:

| Variable | Available In | Purpose |
|----------|-------------|---------|
| `{{ .TokenHash }}` | All auth templates | Hashed token for PKCE flow |
| `{{ .SiteURL }}` | All auth templates | Your application's Site URL |
| `{{ .ConfirmationURL }}` | All auth templates | Full confirmation URL (implicit flow) |
| `{{ .Token }}` | All auth templates | 6-digit OTP code |
| `{{ .Email }}` | All auth templates | User's email address |

### Template Example with All Variables

```html
<h2>Magic Link</h2>
<p>Hello,</p>
<p>A magic link login was requested for {{ .Email }}.</p>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

---

## Troubleshooting Template Issues

### Error: "Error sending magic link email" (500)

**Possible Causes:**
1. **Invalid template syntax**
   - Check for typos in variable names
   - Ensure variables use correct case: `{{ .TokenHash }}` not `{{ .tokenHash }}`
   - Verify all `{{ }}` are properly closed

2. **Missing required variables**
   - Template must include `{{ .TokenHash }}` for PKCE flow
   - Template must include `{{ .SiteURL }}` or use hardcoded URL

3. **Template syntax errors**
   - Invalid HTML
   - Unclosed tags
   - Special characters not escaped

### How to Test Template

1. **Save template in Dashboard**
2. **Try sending a magic link** from your app
3. **Check Supabase Logs:**
   - Dashboard → **Logs** → **Auth Logs**
   - Look for template-related errors
4. **Check email delivery:**
   - If email arrives but link doesn't work → Template URL issue
   - If email doesn't arrive → SMTP or template syntax issue

---

## Quick Fix Checklist

If magic links were working before but now return 500 error:

- [ ] Verify template still uses `{{ .TokenHash }}` (not changed to `{{ .ConfirmationURL }}`)
- [ ] Check `{{ .SiteURL }}` is correct (matches your Site URL setting)
- [ ] Verify template syntax is valid HTML
- [ ] Check for any template changes in Supabase Dashboard
- [ ] Verify SMTP settings are still configured correctly
- [ ] Check Supabase Logs for specific template error messages

---

## Reference

- [Supabase Email Template Documentation](https://supabase.com/docs/guides/local-development/customizing-email-templates#authemailtemplatemagiclink)
- [Template Variables Reference](https://supabase.com/docs/guides/local-development/customizing-email-templates#template-variables)

---

## Next Steps

1. **Verify your template** in Supabase Dashboard matches the PKCE format above
2. **Check Supabase Logs** for specific error messages
3. **Test with a simple template** first to isolate the issue:
   ```html
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
   ```
4. If simple template works, gradually add back your custom styling/content

