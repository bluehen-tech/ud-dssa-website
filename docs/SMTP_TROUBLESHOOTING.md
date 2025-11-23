# SMTP Configuration Troubleshooting Guide

## 🚨 Error: "Error sending magic link email" (500 Internal Server Error)

This error indicates an SMTP configuration issue in your Supabase project.

---

## Quick Diagnosis

### Step 1: Check Supabase SMTP Settings

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `cweznoavmkngturboqdu`
3. Navigate to **Project Settings** (gear icon) → **Authentication** tab
4. Scroll to **SMTP Settings** section

### Step 2: Determine Your SMTP Configuration

**Option A: Custom SMTP (RESEND) - Your Setup**
- "Enable Custom SMTP" should be **ON**
- You're using RESEND with `bluehen-dssa.org` domain
- Verify these settings:
  - **SMTP Host:** `smtp.resend.com` (or RESEND's SMTP endpoint)
  - **SMTP Port:** `465` (SSL) or `587` (TLS)
  - **SMTP User:** Your RESEND API key or username
  - **SMTP Password:** Your RESEND API key or password
  - **Sender Email:** `noreply@bluehen-dssa.org` (or your verified domain)
  - **Sender Name:** UD-DSSA (or your preferred name)

**Option B: Built-in Supabase Email**
- "Enable Custom SMTP" should be **OFF**
- Uses Supabase's default email service
- Should work automatically (free tier: 3 emails/hour)

---

## Troubleshooting Custom SMTP (RESEND)

### 1. Verify RESEND API Key

1. Go to [RESEND Dashboard](https://resend.com/dashboard)
2. Navigate to **API Keys**
3. Verify your API key is active and not expired
4. Copy the API key
5. In Supabase Dashboard → **SMTP Settings**:
   - **SMTP User:** Your RESEND API key
   - **SMTP Password:** Your RESEND API key (or leave blank if not required)

### 2. Verify Domain Configuration

1. In RESEND Dashboard → **Domains**
2. Verify `bluehen-dssa.org` is:
   - ✅ Added to your RESEND account
   - ✅ Verified (DNS records configured)
   - ✅ Active (not suspended)

3. Check DNS records:
   - SPF record
   - DKIM record
   - DMARC record (optional)

### 3. Test SMTP Connection

In Supabase Dashboard → **SMTP Settings**:
1. Click **"Test SMTP Connection"** (if available)
2. Or send a test email
3. Check for error messages

### 4. Check RESEND Dashboard

1. Go to [RESEND Dashboard](https://resend.com/dashboard)
2. Navigate to **Logs** or **Activity**
3. Look for:
   - Failed email attempts
   - API errors
   - Rate limit warnings
   - Domain verification issues

### 5. Verify Email Template

1. In Supabase Dashboard → **Authentication** → **Email Templates**
2. Open **Magic Link** template
3. Verify it uses PKCE flow format:
   ```html
   <h2>Magic Link</h2>
   <p>Follow this link to login:</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
   ```
4. Check for syntax errors:
   - ✅ Uses `{{ .TokenHash }}` (not `{{ .Token }}` or `{{ .ConfirmationURL }}`)
   - ✅ Uses `{{ .SiteURL }}` (not hardcoded URL)
   - ✅ Variable names are case-sensitive: `{{ .TokenHash }}` not `{{ .tokenHash }}`
   - ✅ All `{{ }}` brackets are properly closed
   - ✅ No typos in template variables
5. **Important:** For hosted projects, templates are edited in Dashboard, NOT in config files
6. See `docs/EMAIL_TEMPLATE_VERIFICATION.md` for detailed template verification guide

---

## Troubleshooting Built-in Supabase Email

### 1. Check Rate Limits

- **Free tier:** 3 emails per hour per email address
- **Solution:** Wait 1 hour or use a different email

### 2. Check Supabase Status

1. Go to [Supabase Status Page](https://status.supabase.com)
2. Check if email service is operational
3. Look for any ongoing incidents

### 3. Verify Email Provider is Enabled

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Ensure **Email** provider is **Enabled**
3. Check **Email OTP** settings

---

## Common SMTP Errors and Solutions

### Error: "SMTP connection failed"
**Causes:**
- Incorrect SMTP host or port
- Firewall blocking SMTP port
- Invalid credentials

**Solutions:**
- Verify SMTP host: `smtp.resend.com` (for RESEND)
- Try different ports: `465` (SSL) or `587` (TLS)
- Verify API key is correct
- Check firewall settings

### Error: "Authentication failed"
**Causes:**
- Invalid SMTP username/password
- API key expired or revoked
- Wrong credentials format

**Solutions:**
- Regenerate RESEND API key
- Verify API key in RESEND dashboard
- Check if credentials are copied correctly (no extra spaces)

### Error: "Domain not verified"
**Causes:**
- Domain not added to RESEND
- DNS records not configured
- Domain verification pending

**Solutions:**
- Add domain in RESEND dashboard
- Configure DNS records (SPF, DKIM)
- Wait for DNS propagation (can take up to 48 hours)

### Error: "Rate limit exceeded"
**Causes:**
- Too many emails sent
- RESEND free tier limit reached
- Supabase rate limit

**Solutions:**
- Wait for rate limit to reset
- Upgrade RESEND plan if needed
- Use different email addresses for testing

### Error: "Invalid sender email"
**Causes:**
- Sender email not verified
- Sender email doesn't match domain
- Sender email format incorrect

**Solutions:**
- Use verified domain email: `noreply@bluehen-dssa.org`
- Verify domain in RESEND
- Check sender email format

---

## Step-by-Step Fix for RESEND Setup

### 1. Get RESEND API Key

1. Go to [RESEND Dashboard](https://resend.com/dashboard)
2. Navigate to **API Keys**
3. Click **"Create API Key"**
4. Copy the API key (starts with `re_`)

### 2. Configure Supabase SMTP

1. Go to Supabase Dashboard → **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Enable **"Enable Custom SMTP"**
4. Fill in:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `465` (or `587` for TLS)
   - **SMTP User:** `resend` (or your RESEND API key)
   - **SMTP Password:** Your RESEND API key
   - **Sender Email:** `noreply@bluehen-dssa.org`
   - **Sender Name:** `UD-DSSA`
5. Click **"Save"**

### 3. Verify Domain in RESEND

1. Go to RESEND Dashboard → **Domains**
2. Add `bluehen-dssa.org` if not already added
3. Configure DNS records:
   - **SPF:** `v=spf1 include:resend.com ~all`
   - **DKIM:** (provided by RESEND)
   - **DMARC:** (optional)
4. Wait for verification (can take up to 48 hours)

### 4. Test Email Sending

1. In Supabase Dashboard → **SMTP Settings**
2. Click **"Send Test Email"** (if available)
3. Or try sending a magic link from your app
4. Check RESEND dashboard → **Logs** for delivery status

---

## Checking Supabase Logs

1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for recent magic link attempts
3. Check for detailed error messages:
   - SMTP connection errors
   - Authentication failures
   - Template errors
   - Rate limit errors

---

## Quick Checklist

- [ ] SMTP enabled in Supabase (if using custom SMTP)
- [ ] RESEND API key is valid and active
- [ ] Domain `bluehen-dssa.org` is verified in RESEND
- [ ] DNS records (SPF, DKIM) are configured
- [ ] Email template uses correct PKCE format
- [ ] Sender email matches verified domain
- [ ] Not hitting rate limits (3 emails/hour for free tier)
- [ ] Supabase email provider is enabled
- [ ] Redirect URLs are configured correctly

---

## Still Not Working?

1. **Check Supabase Logs:**
   - Dashboard → **Logs** → **Auth Logs**
   - Look for specific SMTP error messages

2. **Check RESEND Logs:**
   - RESEND Dashboard → **Logs**
   - Look for failed email attempts

3. **Test with Built-in Email:**
   - Temporarily disable custom SMTP
   - Use Supabase's built-in email
   - If this works, issue is with RESEND configuration

4. **Contact Support:**
   - Supabase Support: [support@supabase.com](mailto:support@supabase.com)
   - RESEND Support: [support@resend.com](mailto:support@resend.com)

---

## Reference

- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [RESEND Documentation](https://resend.com/docs)
- [RESEND SMTP Settings](https://resend.com/docs/send-with-smtp)

