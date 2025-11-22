# Quick Email Debugging Checklist

## Immediate Steps

1. **Open Browser Console** (F12)
   - Look for error messages
   - Check for logs starting with "Attempting to send OTP"

2. **Check Supabase Dashboard**
   - Go to: **Authentication** → **Logs**
   - Look for your sign-in attempt
   - Check for error messages

3. **Check Email Settings**
   - Go to: **Authentication** → **Settings** → **Email Auth**
   - Verify email auth is enabled

4. **Check Spam Folder**
   - Check your spam/junk folder
   - Check email filters

## Most Common Issues

### ❌ Rate Limiting (Most Common)
- **Symptom**: No error, but no email
- **Cause**: Free tier = 3 emails/hour per address
- **Fix**: Wait 1 hour or upgrade/use custom SMTP

### ❌ Redirect URL Not Configured
- **Symptom**: Error about redirect URL
- **Fix**: Add to Supabase → Auth → URL Configuration:
  - Development: `http://localhost:3000/auth/callback`
  - Production: `https://yourdomain.com/auth/callback`

### ❌ Email in Spam
- **Symptom**: Email sent but not in inbox
- **Fix**: Check spam folder, whitelist sender

### ❌ SMTP Not Configured
- **Symptom**: Email delivery fails
- **Fix**: Configure custom SMTP in Supabase dashboard

## Quick Test

Try signing in and check:
- [ ] Browser console shows "OTP sent successfully"
- [ ] Supabase logs show the attempt
- [ ] Email received (check spam too)
- [ ] No rate limit errors

## Need More Help?

See `EMAIL_DEBUGGING.md` for detailed troubleshooting steps.

