# Supabase Dashboard Configuration Checklist

## 🚨 CRITICAL: Complete ALL Steps Below

Your 500 error is caused by missing configuration in the Supabase dashboard. Follow each step carefully.

---

## Step 1: Open Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/cweznoavmkngturboqdu**

Login if necessary.

---

## Step 2: Configure Redirect URLs

### Navigate:
1. Click **Authentication** in the left sidebar
2. Click **URL Configuration**

### Add Redirect URLs:
In the **"Redirect URLs"** section, add these URLs (click "+ Add URL" for each):

```
http://localhost:3001/login
http://localhost:3001/auth/callback
```

**Important:** 
- Some Supabase versions show a text area (one URL per line)
- Others show an "+ Add URL" button (click to add each URL separately)
- Make sure BOTH URLs are added

### Save:
Click the **Save** button at the bottom of the page.

---

## Step 3: Set Site URL

In the same **URL Configuration** page:

### Find "Site URL" field:
Set it to:
```
http://localhost:3001
```

### Save:
Click **Save** again.

---

## Step 4: Check Email Template (CRITICAL!)

### Navigate:
1. Stay in **Authentication** section
2. Click **Email Templates**
3. Find **"Magic Link"** template
4. Click to edit it

### Verify the Template:
Your Magic Link email template should look like this for **PKCE flow**:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

**KEY CHECK:** 
- ✅ Should have: `token_hash={{ .TokenHash }}`
- ❌ Should NOT have: `access_token` or `refresh_token` in the URL

If your template looks different (e.g., has `{{ .Token }}` or includes access_token), it's using the old implicit flow.

### Update If Needed:
If it's wrong, replace the entire template with:

```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>

<p>If you didn't request this email, you can safely ignore it.</p>
```

### Save:
Click **Save** button.

---

## Step 5: Create Confirmation Route Handler

Since we're using PKCE flow, we need an endpoint at `/auth/confirm` to exchange the token hash for a session.

This file should already exist at `src/app/auth/callback/route.ts`, but we need to add a confirm handler.

---

## Step 6: Verify Email Provider Settings

### Navigate:
1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Authentication** tab
3. Scroll to **SMTP Settings**

### Check:
- **For Development:** Make sure "Enable Custom SMTP" is **OFF** (use Supabase's built-in email)
- **For Production:** If you have custom SMTP configured, verify the settings are correct

---

## Step 7: Check Rate Limits

If you've been testing repeatedly:
- **Rate Limit:** 3 emails per hour per email address (Supabase free tier)
- **Solution:** Wait 1 hour OR use a different @udel.edu email for testing

---

## Step 8: Verify Auth Settings

### Navigate:
1. **Project Settings** → **Authentication**
2. Check these settings:

**Enable Email provider:** ✅ ON
**Enable email confirmations:** ✅ OFF (for magic link, we don't need double confirmation)
**Secure email change:** Your choice

---

## Step 9: Check Supabase Logs

### Navigate:
1. Click **Logs** in sidebar
2. Click **Auth Logs**
3. Look for recent attempts

### What to Look For:
- ❌ "Invalid redirect URL" errors
- ❌ "Email template error"
- ❌ "SMTP error"
- ✅ "Magic link sent successfully"

---

## Step 10: Test Again

1. **Wait 1-2 minutes** for Supabase to propagate all changes
2. **Clear browser cache** and reload
3. Go to: `http://localhost:3001/login`
4. Enter email: `ajf@udel.edu`
5. Click **"Send Magic Link"**

### Expected Result:
✅ Should see: "Check your inbox! We've sent a magic link to ajf@udel.edu"
✅ No 500 error in console

### If Still 500 Error:
- Check **Logs** → **Auth Logs** in Supabase dashboard for specific error message
- Verify ALL redirect URLs are saved correctly
- Try a different email (might be rate limited)
- Clear ALL browser data and try in incognito mode

---

## Common Issues & Solutions

### Issue: "Invalid redirect URL" in logs
**Solution:** Double-check Step 2. The URL must match EXACTLY: `http://localhost:3001/login`

### Issue: "Email template error" in logs
**Solution:** Check Step 4. Template must use `{{ .TokenHash }}` not `{{ .Token }}`

### Issue: Email not arriving
**Solutions:**
- Check spam folder
- Verify you haven't hit rate limit (3/hour)
- Check SMTP settings (Step 6)
- Try different email address

### Issue: Email arrives but link doesn't work
**Solution:** 
- Make sure you completed Step 5 (auth confirmation handler)
- Verify email template uses `/auth/confirm` endpoint

---

## Screenshot Reference

When configured correctly, your URL Configuration page should look like:

```
┌──────────────────────────────────────────────────────┐
│ URL Configuration                                     │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Site URL                                              │
│ ┌──────────────────────────────────────────────┐    │
│ │ http://localhost:3001                         │    │
│ └──────────────────────────────────────────────┘    │
│                                                       │
│ Redirect URLs                                         │
│ ┌──────────────────────────────────────────────┐    │
│ │ • http://localhost:3001/login                 │    │
│ │ • http://localhost:3001/auth/callback         │    │
│ └──────────────────────────────────────────────┘    │
│                                                       │
│                            [Save]                     │
└──────────────────────────────────────────────────────┘
```

---

## Still Not Working?

### Debug Steps:
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try sending magic link again
4. Find the failed request to `/auth/v1/otp`
5. Click on it and check the **Response** tab
6. Share the exact error message

### Contact Support:
If all else fails, you might need to contact Supabase support with:
- Your project ref: `cweznoavmkngturboqdu`
- The exact error from Network tab
- Screenshot of your URL Configuration page




