# Quick Fix: Add This URL to Supabase Dashboard

## 🚨 IMMEDIATE ACTION REQUIRED

Your magic link is failing because this URL is not whitelisted:

```
http://localhost:3001/login
```

## Steps to Fix (Takes 2 minutes):

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/cweznoavmkngturboqdu

### 2. Navigate to Authentication Settings
- Click **Authentication** in the left sidebar
- Click **URL Configuration**

### 3. Add These URLs to "Redirect URLs"
Copy and paste these into the "Redirect URLs" field (one per line):

```
http://localhost:3001/login
http://localhost:3001/auth/callback
```

If you see a single text field, paste them like this:
```
http://localhost:3001/login, http://localhost:3001/auth/callback
```

### 4. Set Site URL
In the same page, set **Site URL** to:
```
http://localhost:3001
```

### 5. Save Changes
Click the **Save** button at the bottom

### 6. Wait 1 Minute
Supabase needs a moment to propagate the changes

### 7. Test Again
- Refresh your browser at http://localhost:3001/login
- Enter your @udel.edu email
- Click "Send Magic Link"

## Expected Result
You should see:
✅ "Check your inbox! We've sent a magic link to ajf@udel.edu"

## Still Not Working?

### Check Rate Limit
If you've been testing a lot, you might have hit the rate limit:
- **3 emails per hour** per email address
- **Solution**: Wait 1 hour OR try a different @udel.edu email

### Check Spam Folder
The email might be in your spam/junk folder

### Check Supabase Logs
In dashboard:
- Go to **Logs** → **Auth Logs**
- Look for your recent sign-in attempt
- Check for error messages

### Verify Email Template is Enabled
In dashboard:
- Go to **Authentication** → **Email Templates**  
- Make sure **Magic Link** template is enabled
- Make sure it has a valid template (don't edit unless needed)

## Screenshot Guide
When you're in the Supabase dashboard, look for:

```
┌─────────────────────────────────────────────┐
│ Authentication                               │
├─────────────────────────────────────────────┤
│                                             │
│ URL Configuration                           │
│                                             │
│ Site URL                                    │
│ ┌─────────────────────────────────────┐   │
│ │ http://localhost:3001                │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Redirect URLs                               │
│ ┌─────────────────────────────────────┐   │
│ │ http://localhost:3001/login          │   │
│ │ http://localhost:3001/auth/callback  │   │
│ └─────────────────────────────────────┘   │
│                                             │
│          [Save]                             │
└─────────────────────────────────────────────┘
```

## After Configuration

Your app should work! The error message will change from:
❌ `AuthApiError: Error sending magic link email`

To:
✅ `Check your inbox! We've sent a magic link to your@email.com`

---

## Technical Details (for reference)

**Why this is required:**
Supabase validates all redirect URLs to prevent open redirect vulnerabilities. Any URL used in the `emailRedirectTo` parameter must be explicitly whitelisted in the dashboard.

**What happens when you click the magic link:**
1. Email contains a URL like: `https://<project>.supabase.co/auth/v1/verify?token=...&redirect_to=http://localhost:3001/login`
2. Supabase verifies the token
3. Supabase redirects to your app with auth hash: `http://localhost:3001/login#access_token=...`
4. Your app's Supabase client auto-detects the hash and signs you in
5. You're redirected to `/opportunities`

**Security note:**
Never add wildcard URLs or untrusted domains to the Redirect URLs list. Only add URLs you control.




