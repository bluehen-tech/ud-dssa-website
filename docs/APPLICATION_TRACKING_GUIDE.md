# Application Tracking Feature - Complete Setup Guide

## What's New!

I've added **application tracking** to your UD-DSSA website! Now you can:
- ✅ Track which users apply to which opportunities
- ✅ Users see "Applied" status on opportunities they've applied to
- ✅ Users can withdraw applications
- ✅ Admins can view all applications in one place
- ✅ Admins can download resumes for each application
- ✅ Export applications to CSV for employers
- ✅ Update application status (pending, reviewed, contacted, rejected)

## Required Supabase Setup

### Step 1: Run the Applications SQL Script

1. Go to your Supabase Dashboard → SQL Editor
2. Open and run the file: **`supabase/APPLICATIONS_SETUP.sql`**

This creates:
- `applications` table to track who applied to what
- Row Level Security policies
- A view (`applications_with_user_info`) for easy admin access
- Indexes for fast queries

### Step 2: That's It!

Unlike the resume upload feature, application tracking doesn't need storage buckets - it just uses the database!

## How It Works

### For Regular Users

1. **Upload Resume First**: Users must upload a resume before applying
2. **Click "Apply Now"**: On the opportunities page, click the blue "Apply Now" button
3. **See Applied Status**: Button changes to green "Applied" badge
4. **Withdraw if Needed**: Users can withdraw their application anytime

### For Admins

1. **Visit Admin Page**: Go to `/opportunities/applications`
2. **View All Applications**: See every application across all opportunities
3. **Filter by Opportunity**: Select a specific opportunity to see its applications
4. **Download Resumes**: Click "Download Resume" for any application
5. **Export to CSV**: Export application data for a specific opportunity
6. **Update Status**: Change application status (pending → reviewed → contacted)

## Features

### User Experience

**Before Applying:**
```
[Apply Now] button (blue)
```

**After Applying:**
```
[✓ Applied] badge (green)
[Withdraw Application] button (red border)
```

**Without Resume:**
- Clicking Apply prompts user to upload resume first
- Opens upload modal automatically

### Admin Dashboard

**Filter Options:**
- View all applications
- Filter by specific opportunity
- See application counts per opportunity

**Actions Available:**
- Download individual resumes
- Export applications to CSV
- Update application status
- View applicant email and apply date

**Status Options:**
- **Pending**: Just submitted (default)
- **Reviewed**: Admin has reviewed
- **Contacted**: Employer has contacted applicant
- **Rejected**: Not moving forward
- **Withdrawn**: User withdrew application

## Database Schema

### Applications Table

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  opportunity_id TEXT NOT NULL,
  resume_upload_id UUID REFERENCES resume_uploads(id),
  applied_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  UNIQUE(user_id, opportunity_id) -- Prevent duplicate applications
);
```

**Key Features:**
- Users can only apply once per opportunity
- Tracks which resume was used
- Links to user's uploaded resume
- Cascade deletes if user is deleted

### Applications With User Info View

For easy admin access, there's a view that joins applications with user data:

```sql
CREATE VIEW applications_with_user_info AS
SELECT 
  a.id,
  a.opportunity_id,
  a.applied_at,
  a.status,
  a.notes,
  p.email,
  r.file_name as resume_file_name,
  r.file_path as resume_file_path,
  r.file_size as resume_file_size,
  r.uploaded_at as resume_uploaded_at
FROM applications a
LEFT JOIN profiles p ON a.user_id = p.id
LEFT JOIN resume_uploads r ON a.resume_upload_id = r.id;
```

This makes it easy to see all application data in one query!

## Security

### Row Level Security (RLS)

**Users can:**
- ✅ View their own applications
- ✅ Create new applications (must be pending status)
- ✅ Withdraw their own applications

**Users cannot:**
- ❌ See other users' applications
- ❌ Change status to anything except 'withdrawn'
- ❌ Apply to the same opportunity twice

**Admins can:**
- ✅ View all applications
- ✅ Update any application status
- ✅ Download any resume

## Testing

### Test as Regular User

1. Sign in with @udel.edu email
2. Upload a resume on the Opportunities page
3. Click "Apply Now" on an opportunity
4. See the "Applied" badge appear
5. Try to apply again (should be prevented)
6. Click "Withdraw Application" to test withdrawal

### Test as Admin

1. Sign in as admin (ajf@udel.edu or your admin account)
2. Go to `/opportunities/applications`
3. You should see all applications
4. Filter by a specific opportunity
5. Download a resume
6. Export applications to CSV
7. Update an application status

## Sending Resumes to Employers

### Option 1: Export to CSV

1. Go to `/opportunities/applications`
2. Filter by the specific opportunity
3. Click "Export Applications (CSV)"
4. CSV includes: email, apply date, status, resume file name
5. Send CSV to employer with instructions to contact applicants

### Option 2: Download All Resumes

1. Go to `/opportunities/applications`
2. Filter by the specific opportunity
3. Click "Download Resume" for each application
4. Collect all resumes in a folder
5. Send folder to employer

### Option 3: Share Applicant Emails

1. Export to CSV (includes emails)
2. Share email list with employer
3. Employer contacts applicants directly
4. You update status as "contacted" in the system

## Files Created/Modified

### New Files:
- `supabase/APPLICATIONS_SETUP.sql` - Database setup
- `src/hooks/useApplications.ts` - Application management hook
- `src/app/opportunities/applications/page.tsx` - Admin dashboard

### Modified Files:
- `src/app/opportunities/page.tsx` - Added Apply buttons and application tracking

## Tips

### For Best Results:

1. **Require Resume Upload**: The system prompts users to upload resumes before applying
2. **Monitor Applications**: Check the admin dashboard regularly
3. **Update Status**: Keep application status up to date for tracking
4. **Export Regularly**: Export CSV files to keep records outside the system
5. **Clear Communication**: Tell employers what status updates mean

### Common Workflows:

**Posting New Opportunity:**
1. Add opportunity to `src/data/opportunities.ts`
2. Deploy website
3. Monitor applications via `/opportunities/applications`

**Sending to Employer:**
1. Filter by opportunity
2. Export CSV
3. Download all resumes
4. Send package to employer
5. Update status to "contacted"

**Following Up:**
1. Employer provides feedback
2. Update status (reviewed/contacted/rejected)
3. Users can see their application status in future features

## Future Enhancements

Possible additions:
- Email notifications when users apply
- User dashboard showing all their applications
- Employer portal to view applications directly
- Application notes/comments
- Deadline tracking
- Application analytics
- Resume version history

## Troubleshooting

### "Failed to apply"
- Check that user has uploaded a resume
- Verify they haven't already applied
- Check Supabase logs for errors

### Admin can't see applications
- Verify user has `admin_flag = true` in profiles table
- Check that applications table exists
- Ensure RLS policies are configured

### Can't download resumes
- Check that resume exists in storage
- Verify storage RLS policies allow admin access
- Check browser console for errors

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Verify all SQL scripts were run
3. Test RLS policies in Supabase SQL Editor
4. Check browser console for errors

---

**Ready to test!** Run `npm run dev` and try applying to an opportunity!

