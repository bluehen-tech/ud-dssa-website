# Documentation Index

This directory contains all documentation for the UD-DSSA website.

## Quick Start

New to the project? Start here:

1. **[README.md](../README.md)** - Project overview and setup instructions
2. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Configure Supabase for authentication and database
3. **[AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md)** - How authentication works

## Documentation Files

### Setup & Configuration

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**
  - Supabase project configuration
  - Redirect URLs and email templates
  - Database setup with RLS policies
  - Environment variables
  - **Use this for initial setup**

### Authentication

- **[AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md)**
  - Complete authentication implementation guide
  - Technical architecture overview
  - Database schema and RLS policies
  - Console logs reference
  - Future improvements
  - **Use this to understand how auth works**

### Troubleshooting

- **[TROUBLESHOOTING_AUTH.md](./TROUBLESHOOTING_AUTH.md)**
  - Common authentication issues and fixes
  - RLS policy problems
  - Magic link behavior explanation
  - Sign out issues
  - Build cache errors
  - **Use this when something isn't working**

## SQL Scripts

Located in `/supabase` directory:

- **[MUST_RUN_THIS.sql](../supabase/MUST_RUN_THIS.sql)**
  - Quick setup script for profiles table
  - RLS policies
  - Initial admin user creation
  - **Run this first when setting up a new Supabase project**

- **[fix_profiles_rls.sql](../supabase/fix_profiles_rls.sql)**
  - Comprehensive RLS policy setup
  - Troubleshooting queries
  - Profile management
  - **Use this if admin status isn't working**

## Key Concepts

### Authentication Flow

1. User enters @udel.edu email on `/login`
2. Magic link sent via Supabase
3. User clicks link (opens in new window/tab)
4. Supabase processes auth tokens
5. `AuthContext` detects sign-in via `onAuthStateChange`
6. Admin status fetched from `profiles` table
7. User redirected to destination page

### Admin Roles

- Admin status is stored in the `profiles` table
- `admin_flag = true` for admin users
- Admin badge displayed in header
- Managed via Supabase database

### Protected Routes

- `/officers` - Requires authentication
- `/opportunities` - Public, but shows sign-in prompt if logged out
- Middleware handles route protection

### Session Management

- 4-hour session duration
- Auto-refresh enabled
- Session persists across page refreshes
- Sign out clears all session data

## Common Tasks

### Making a User Admin

```sql
UPDATE profiles
SET admin_flag = true
WHERE email = 'user@udel.edu';
```

### Checking Auth Logs

1. Open browser console (F12)
2. Look for logs starting with:
   - `Auth state change:`
   - `✅ User role:`
   - `Error fetching...`

### Clearing Build Cache

```bash
# If you see layout.js syntax errors
rm -rf .next
npm run dev
```

### Testing Authentication

1. Go to `http://localhost:3000/login`
2. Enter your @udel.edu email
3. Check email for magic link
4. Click link (may open new window)
5. Verify you're signed in
6. Check header shows your email and role

## Getting Help

1. **Check the troubleshooting guide first**: [TROUBLESHOOTING_AUTH.md](./TROUBLESHOOTING_AUTH.md)
2. **Look at console logs** for error messages
3. **Check Supabase Dashboard**:
   - Authentication → Logs
   - Table Editor → profiles
4. **Review the implementation summary**: [AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md)

## Contributing

When adding new features or fixing bugs:

1. Update relevant documentation
2. Add SQL scripts if database changes are needed
3. Update this index if adding new docs
4. Test all authentication flows
5. Update troubleshooting guide with any new issues found

---

Last Updated: November 22, 2024

