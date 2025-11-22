# Supabase Configuration for UD-DSSA Website

## Authentication Setup

### Redirect URLs Configuration

To enable magic link authentication, you need to configure the redirect URLs in your Supabase project:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following to **Redirect URLs**:

**For Local Development:**
```
http://localhost:3000/login
```

**For Production (Vercel):**
```
https://ud-dssa-website.vercel.app/login
```

**For Production (Custom Domain):**
```
https://bluehen-dssa.org/login
```

### Site URL

Set the **Site URL** to your primary domain:
```
https://bluehen-dssa.org
```

### Email Templates

The magic link email template should be configured in:
- **Authentication** → **Email Templates** → **Magic Link**

The default template works perfectly. Supabase uses **implicit flow** by default, which includes the tokens in the URL hash fragment.

### How It Works (Canonical Flow)

This implementation follows Supabase's recommended pattern:

1. User enters email on `/login` page
2. Client calls `supabase.auth.signInWithOtp()` with `emailRedirectTo: '/login'`
3. Supabase sends magic link email to user
4. User clicks link → opens in browser (may be new window/tab)
5. Browser loads `/login#access_token=...&refresh_token=...`
6. **Supabase JS automatically detects and processes the hash**
7. Supabase fires `SIGNED_IN` event via `onAuthStateChange`
8. Login page listens for `SIGNED_IN` event
9. Email domain is validated (@udel.edu)
10. User is redirected to `/opportunities`

**Key Point:** We don't manually call `setSession()`. Supabase handles the hash automatically!

### Why This Approach Works

✅ **Follows Supabase best practices** - Let Supabase handle auth flow
✅ **No race conditions** - Single auth state listener
✅ **No infinite loops** - Hash is cleared after detection
✅ **Works with email clients** - Handles new window opening
✅ **Proper session persistence** - Supabase manages cookies/storage

### Troubleshooting

**Infinite Loop Issues:**
- Ensure redirect URLs are configured in Supabase
- Check browser console for redirect logs
- Clear browser cache and localStorage
- Check that email domain is `@udel.edu`

**Session Not Persisting:**
- Check localStorage for `supabase.auth.token`
- Verify session timeout settings (currently 4 hours)
- Check browser console for auth errors

**Email Not Arriving:**
- Check spam folder
- Verify email in Supabase Dashboard → Authentication → Users
- Check Supabase logs for email delivery status
- Free tier has rate limits (3 emails/hour per address)

## Database Setup

### Profiles Table

The `profiles` table tracks admin users:

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  admin_flag boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Allow authenticated users to read their own profile
create policy "Users can read own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

-- Allow users to insert their own profile
-- SECURITY: Prevents privilege escalation
create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and admin_flag = false  -- Cannot self-promote to admin
  );

-- Allow users to update their own profile
-- SECURITY: Cannot change admin_flag or email
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and admin_flag = (select admin_flag from profiles where id = auth.uid())
    and email = (select email from profiles where id = auth.uid())
  );
```

**🔒 Security Note:** These RLS policies prevent users from promoting themselves to admin or changing their email. Only database administrators (via Supabase dashboard or service role) can modify `admin_flag` and `email` fields.

### Adding Admin Users

To make a user an admin:

```sql
-- Insert or update profile
insert into profiles (id, email, admin_flag)
values (
  'user-uuid-here',
  'user@udel.edu',
  true
)
on conflict (id) do update
set admin_flag = true;
```

Or using the Supabase dashboard:
1. Go to **Table Editor** → `profiles`
2. Find the user by email or add new row
3. Set `admin_flag` to `true`

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from:
- Supabase Dashboard → **Settings** → **API**

