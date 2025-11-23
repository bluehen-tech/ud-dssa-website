# Application Tracking - Quick Setup

## What You Need to Do

### Step 1: Run ONE SQL Script

1. Go to your Supabase Dashboard → SQL Editor
2. Run the file: **`supabase/APPLICATIONS_SETUP.sql`**
3. That's it! No storage buckets needed.

### Step 2: Test It

```bash
npm run dev
```

**As a Regular User:**
1. Sign in and upload a resume
2. Click "Apply Now" on an opportunity
3. See it change to "Applied ✓"

**As an Admin:**
1. Go to http://localhost:3000/opportunities/applications
2. See all applications
3. Download resumes
4. Export to CSV

## Features

### For Users
- Click "Apply Now" to apply (requires resume)
- See "Applied" badge after applying
- Withdraw applications if needed
- Cannot apply twice to same opportunity

### For Admins
- View all applications at `/opportunities/applications`
- Filter by specific opportunity
- Download individual resumes
- Export applications to CSV
- Update application status

## Sending Resumes to Employers

**Easy Workflow:**
1. Go to `/opportunities/applications`
2. Filter by the opportunity
3. Click "Export Applications (CSV)"
4. Download all resumes by clicking each "Download Resume" button
5. Send resumes + CSV to employer

The CSV includes:
- Applicant emails
- Apply dates
- Resume filenames
- Status

## Files Created

**New:**
- `supabase/APPLICATIONS_SETUP.sql` - Database setup
- `src/hooks/useApplications.ts` - Application logic
- `src/app/opportunities/applications/page.tsx` - Admin dashboard
- `docs/APPLICATION_TRACKING_GUIDE.md` - Full documentation

**Modified:**
- `src/app/opportunities/page.tsx` - Added Apply buttons

## Application Flow

1. User uploads resume → stored in Supabase Storage
2. User clicks "Apply Now" → creates application record
3. Application links to their resume
4. Admin can view all applications and download resumes
5. Admin exports data for employer

## Status Tracking

Applications can have these statuses:
- **pending** - Just submitted (default)
- **reviewed** - You've reviewed it
- **contacted** - Employer contacted applicant
- **rejected** - Not moving forward
- **withdrawn** - User withdrew

## Security

✅ Users can only see/manage their own applications  
✅ Admins can see all applications and download all resumes  
✅ Users can't apply twice to the same opportunity  
✅ All data protected by Row Level Security  

## Need Help?

See the full guide: `docs/APPLICATION_TRACKING_GUIDE.md`

---

**That's it!** Run the SQL script and start tracking applications! 🎉

