# Authentication Troubleshooting Guide

> **⚠️ This file is deprecated. See [docs/SUPABASE.md](./SUPABASE.md) for the consolidated documentation.**

## Issue: Admin Status Not Loading

### Symptoms:
- Console shows `🔍 Fetching admin status for user ID: [uuid]`
- But never shows `📊 Profile data: {...}`
- Header always shows "Member" even for admin users

### Root Cause:
The `profiles` table likely has Row Level Security (RLS) enabled, which prevents authenticated users from reading their own profile.

### Solution:

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if RLS is enabled on profiles table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- If rowsecurity is true, you need to add RLS policies

-- Policy 1: Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow users to insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Verification:

1. Sign in to your app
2. Open browser console (F12)
3. You should now see:
   ```
   🔍 Fetching admin status for user ID: [uuid]
   📊 Profile data: { admin_flag: true }
   ✅ Admin status result: true
   👤 User role set to: Admin
   ```

### Creating a Profile for a User:

If a user doesn't have a profile yet, create one:

```sql
-- Get the user's ID first
SELECT id, email FROM auth.users WHERE email = 'ajf@udel.edu';

-- Create the profile (replace 'user-id-here' with actual ID from above)
INSERT INTO profiles (id, email, admin_flag)
VALUES ('37ed6bef-51fa-486e-82c5-78ac8b67cff0', 'ajf@udel.edu', true)
ON CONFLICT (id) 
DO UPDATE SET 
  email = EXCLUDED.email,
  admin_flag = EXCLUDED.admin_flag;
```

## Issue: Magic Link Opens New Browser Window

### Behavior:
When you click a magic link in your email, it opens in a **new browser window/tab**.

### Is This Normal?
**YES!** This is standard email client behavior and is actually a security feature.

### Which Window Should You Use?

**Answer: Use the NEW window that opened from the magic link.**

- The **original window** (where you requested the magic link) remains logged out
- The **new window** (opened from the email link) will be logged in
- This is because browser sessions are per-tab and the auth tokens are in the URL of the new window

### How It Works:

1. You visit the website and click "Sign In"
2. You enter your email and click "Send Magic Link"
3. You receive an email with a link
4. You click the link in your email
5. Your **email client** opens a **new browser window/tab** with the link
6. The new window processes the auth tokens and signs you in
7. **Close the old window** and use the new one

### Why Not the Original Window?

Email clients (Gmail, Outlook, etc.) always open links in new windows for security reasons. We cannot control this behavior from the website.

### Alternative: Copy-Paste the Link

If you want to sign in on the original window:
1. Right-click the magic link in your email
2. Select "Copy Link Address"
3. Go back to your original browser window
4. Paste the link in the address bar
5. Press Enter

This way you'll be signed in on the original window.

## Issue: Sign Out Not Working

### Symptoms:
- Click "Sign Out"
- Page refreshes
- Refresh page again → still shows signed in

### Solution Implemented:

The sign out function now:
1. Calls `supabase.auth.signOut({ scope: 'local' })`
2. Explicitly clears all Supabase auth tokens from localStorage
3. Clears local React state
4. Forces a hard page reload with `window.location.href = '/'`

### Expected Logs:

When you click "Sign Out", you should see:
```
🚪 Signing out...
✅ Supabase signOut successful
🧹 Cleared localStorage key: sb-{project-ref}-auth-token
✅ Local state cleared
```

Then after page reload:
```
🔄 Initializing session...
📦 Session from storage: null
⭕ No valid session in storage
```

### If Still Not Working:

Clear your browser cache:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or manually clear localStorage:
```javascript
// Run this in browser console
localStorage.clear();
location.reload();
```

## Issue: Build Cache Errors (layout.js:61)

### Symptoms:
- First load shows: `layout.js:61 Uncaught SyntaxError: Invalid or unexpected token`
- Refresh works fine

### Solution:

Clear the Next.js build cache:

**PowerShell:**
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

**Bash:**
```bash
rm -rf .next
npm run dev
```

This forces Next.js to rebuild everything from scratch, fixing any corrupted cached files.

