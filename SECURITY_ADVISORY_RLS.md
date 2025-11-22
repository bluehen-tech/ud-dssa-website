# Security Advisory: RLS Privilege Escalation Vulnerability

**Date**: November 22, 2024  
**Severity**: HIGH  
**Status**: FIXED  

## Summary

A privilege escalation vulnerability was discovered in the Row Level Security (RLS) policies for the `profiles` table. The original policies allowed authenticated users to modify their own `admin_flag` field, enabling them to grant themselves administrative privileges.

## Vulnerability Details

### Affected Code

**Original Vulnerable Policy:**
```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);  -- ❌ No column restrictions
```

### Attack Vector

A malicious user could execute:
```javascript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Privilege escalation attack
await supabase
  .from('profiles')
  .update({ admin_flag: true })  // 🚨 Promote self to admin
  .eq('id', user.id);
```

**Result**: User gains admin privileges without authorization.

### Impact

- **Privilege Escalation**: Any authenticated user could promote themselves to admin
- **Unauthorized Access**: Admin features could be accessed by non-admin users
- **Data Integrity**: Email addresses could also be changed, bypassing domain validation

## Fix

### Secure RLS Policies

**Update Policy (Secure):**
```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND admin_flag = (SELECT admin_flag FROM profiles WHERE id = auth.uid())  -- ✅ Must keep existing value
  AND email = (SELECT email FROM profiles WHERE id = auth.uid())            -- ✅ Must keep existing value
);
```

**Insert Policy (Secure):**
```sql
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND admin_flag = false  -- ✅ Force false on insert
);
```

### What This Prevents

1. **Privilege Escalation on Update**: Users cannot change their `admin_flag` from `false` to `true`
2. **Privilege Escalation on Insert**: New users cannot create profiles with `admin_flag = true`
3. **Email Tampering**: Users cannot change their email address after creation

### Admin Management

Only these methods can modify `admin_flag`:

1. **Supabase Dashboard**: Admin can directly edit the `profiles` table
2. **Service Role**: Server-side code using service role key
3. **Database Superuser**: Direct SQL queries as postgres user

## Remediation Steps

### For Existing Deployments

1. **Run the fix immediately**:
   ```bash
   # In Supabase SQL Editor, run:
   cat supabase/SECURE_RLS_POLICIES.sql
   ```

2. **Audit existing admins**:
   ```sql
   -- Check who has admin privileges
   SELECT id, email, admin_flag, created_at 
   FROM profiles 
   WHERE admin_flag = true
   ORDER BY created_at DESC;
   ```

3. **Revoke unauthorized admins**:
   ```sql
   -- If you find unauthorized admins
   UPDATE profiles
   SET admin_flag = false
   WHERE email NOT IN ('authorized-admin@udel.edu', 'another-admin@udel.edu');
   ```

4. **Check audit logs** (if available):
   - Supabase Dashboard → Logs → Database
   - Look for UPDATE queries on profiles table
   - Check for suspicious admin_flag changes

### For New Deployments

Run `supabase/MUST_RUN_THIS.sql` which now includes the secure policies.

## Testing

### Verify the Fix

1. **As a regular user**, try to promote yourself:
   ```javascript
   const { error } = await supabase
     .from('profiles')
     .update({ admin_flag: true })
     .eq('id', supabase.auth.getUser().data.user.id);
   
   // Expected: error with message about RLS policy violation
   console.log(error); // Should show: "new row violates row-level security policy"
   ```

2. **Check policies in Supabase**:
   ```sql
   SELECT policyname, cmd, with_check
   FROM pg_policies
   WHERE tablename = 'profiles';
   ```

   Expected output should show the WITH CHECK constraints on admin_flag and email.

3. **Test admin assignment** (via Dashboard):
   - Go to Table Editor → profiles
   - Manually set admin_flag = true for authorized user
   - Verify it works (this bypasses RLS as expected)

## Prevention

### Best Practices Implemented

1. **Principle of Least Privilege**: Users can only modify non-sensitive fields
2. **Immutable Fields**: Critical fields (admin_flag, email) cannot be changed by users
3. **Default Deny**: admin_flag defaults to false and cannot be set to true by users
4. **Server-Side Administration**: Admin changes require elevated privileges

### Code Review Checklist

When reviewing RLS policies:
- [ ] Does WITH CHECK restrict sensitive columns?
- [ ] Can users escalate their own privileges?
- [ ] Are immutable fields protected?
- [ ] Is there proper separation between user and admin capabilities?
- [ ] Do INSERT policies prevent privilege escalation?
- [ ] Are there audit mechanisms in place?

## Related Files

- `supabase/MUST_RUN_THIS.sql` - Updated with secure policies
- `supabase/SECURE_RLS_POLICIES.sql` - Dedicated security fix
- `supabase/fix_profiles_rls.sql` - Comprehensive setup with secure policies
- `docs/SUPABASE_SETUP.md` - Updated documentation
- `docs/AUTH_IMPLEMENTATION_SUMMARY.md` - Updated with security note

## Credits

Vulnerability discovered during security review of RLS policies.

## References

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Privilege Escalation](https://owasp.org/www-community/attacks/Privilege_escalation)

---

**Action Required**: If you have already deployed this application, run the fix SQL script immediately and audit your admin users.

