# Email OTP Debugging Guide

If you're not receiving the magic link email after signing in, follow these debugging steps:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Try signing in again
4. Look for any error messages or logs that start with:
   - `Attempting to send OTP to:`
   - `Sign in error:`
   - `Unexpected error:`

## Step 2: Check Supabase Dashboard

### A. Check Authentication Logs

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Logs**
3. Look for recent sign-in attempts
4. Check for any error messages

### B. Check Email Settings

1. Go to: **Authentication** → **Settings** → **Email Auth**
2. Verify:
   - ✅ **Enable Email Auth** is turned ON
   - ✅ **Enable Email Confirmations** is configured correctly
   - ✅ **Email Templates** are set up

### C. Check SMTP Configuration

1. Go to: **Settings** → **Auth** → **SMTP Settings**
2. Verify SMTP is configured:
   - **Option 1**: Using Supabase's built-in email (default)
     - Should work out of the box for development
     - Limited to 3 emails/hour on free tier
   - **Option 2**: Custom SMTP (recommended for production)
     - Configure your own SMTP server
     - Better deliverability and higher limits

## Step 3: Common Issues & Solutions

### Issue 1: Email Rate Limiting

**Symptom**: No error, but no email received

**Solution**: 
- Supabase free tier limits: 3 emails per hour per email address
- Wait 1 hour and try again
- Or upgrade to a paid plan for higher limits
- Or configure custom SMTP

### Issue 2: Email in Spam/Junk Folder

**Symptom**: Email sent but not in inbox

**Solution**:
- Check your spam/junk folder
- Check email filters
- Add Supabase sender to contacts/whitelist

### Issue 3: Email Domain Restrictions

**Symptom**: Error message about email not allowed

**Solution**:
1. Go to: **Authentication** → **Settings** → **Auth**
2. Check **Site URL** is set correctly
3. Check **Redirect URLs** includes your callback URL:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### Issue 4: Email Template Issues

**Symptom**: Email sent but link doesn't work

**Solution**:
1. Go to: **Authentication** → **Email Templates** → **Magic Link**
2. Verify the template includes: `{{ .ConfirmationURL }}`
3. Check that redirect URL is correct

### Issue 5: Environment Variables

**Symptom**: Connection errors or API errors

**Solution**:
1. Verify `.env.local` has correct values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Restart your development server after changing env vars
3. Check that values match your Supabase dashboard

## Step 4: Test Email Delivery

### Option A: Use Supabase Dashboard

1. Go to: **Authentication** → **Users**
2. Click **Invite User** or **Add User**
3. Enter your email
4. Check if invitation email is received
5. This tests if email delivery is working at all

### Option B: Check Email Logs

1. Go to: **Settings** → **Logs** → **Email Logs**
2. Look for recent email attempts
3. Check delivery status and any error messages

### Option C: Use Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Check project status
supabase projects list

# View logs
supabase logs --project-ref your-project-ref
```

## Step 5: Development vs Production

### Development (localhost)

- **Site URL**: `http://localhost:3000`
- **Redirect URL**: `http://localhost:3000/auth/callback`
- Make sure these are added in Supabase dashboard:
  - **Authentication** → **URL Configuration** → **Redirect URLs**

### Production

- **Site URL**: `https://yourdomain.com`
- **Redirect URL**: `https://yourdomain.com/auth/callback`
- Update in Supabase dashboard before deploying

## Step 6: Alternative: Use OTP Code Instead of Magic Link

If magic links aren't working, you can temporarily use OTP codes:

1. Modify the login to request OTP code:
   ```typescript
   const { data, error } = await supabase.auth.signInWithOtp({
     email,
     options: {
       shouldCreateUser: true,
     },
   });
   ```

2. Then verify with code:
   ```typescript
   const { data, error } = await supabase.auth.verifyOtp({
     email,
     token: code,
     type: 'email',
   });
   ```

## Step 7: Enable Debug Mode

Add this to your login page temporarily to see full response:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: getRedirectUrl(),
  },
});

console.log('Full response:', JSON.stringify({ data, error }, null, 2));
```

## Quick Checklist

- [ ] Browser console shows no errors
- [ ] Supabase dashboard shows sign-in attempt in logs
- [ ] Email settings are enabled in Supabase
- [ ] Site URL and Redirect URLs are configured correctly
- [ ] Checked spam/junk folder
- [ ] Not hitting rate limits (3 emails/hour on free tier)
- [ ] Environment variables are correct
- [ ] Development server restarted after env changes

## Still Not Working?

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Email Provider**: Some email providers block automated emails
3. **Try Different Email**: Test with a Gmail or Outlook email
4. **Contact Supabase Support**: If all else fails, contact Supabase support with:
   - Your project reference ID
   - Email address you're testing with
   - Timestamp of the attempt
   - Screenshot of Authentication logs

## Production Recommendations

For production, configure custom SMTP:

1. **Use a reliable email service**:
   - SendGrid
   - Mailgun
   - AWS SES
   - Postmark

2. **Configure in Supabase**:
   - Go to: **Settings** → **Auth** → **SMTP Settings**
   - Enter your SMTP credentials
   - Test the connection

3. **Benefits**:
   - Higher email limits
   - Better deliverability
   - Custom sender address
   - Email analytics

