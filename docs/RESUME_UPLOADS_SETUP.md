# Resume Uploads Setup Guide

This guide walks you through setting up the resume upload feature for the UD-DSSA website.

## Overview

The resume upload feature allows authenticated users to:
- Upload resumes (PDF, DOC, or DOCX, max 5MB) for specific opportunities
- View resume status for each opportunity on the opportunities page
- Download any uploaded resume
- Replace a resume for just one opportunity without affecting others
- Delete an uploaded resume

All resumes are stored securely in Supabase Storage with Row Level Security (RLS) policies ensuring users can only access their own files.

## Prerequisites

- Supabase project set up and configured
- Basic authentication working (users can sign in)
- Environment variables configured (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Setup Steps

### Step 1: Create the Database Table

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/RESUME_UPLOADS_SETUP.sql`
6. Click **Run**

This will:
- Create the `opportunity_resumes` table
- Enable Row Level Security (RLS)
- Create RLS policies so users can only access their own resume records
- Create an index for faster queries

### Step 2: Create the Storage Bucket

1. In your Supabase Dashboard, navigate to **Storage**
2. Click **Create a new bucket**
3. Name the bucket: `resumes`
4. Set **Public bucket** to **OFF** (resumes should be private)
5. Click **Create bucket**

### Step 3: Configure Storage RLS Policies

After creating the bucket, you need to add RLS policies to control access:

1. Click on the `resumes` bucket
2. Go to **Policies** tab
3. Click **New policy**

Create the following 4 policies:

#### Policy 1: SELECT (Download)
- **Policy name**: Users can download own resume
- **Allowed operation**: SELECT
- **Target roles**: authenticated
- **USING expression**:
```sql
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[2])
```

#### Policy 2: INSERT (Upload)
- **Policy name**: Users can upload own resume
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **WITH CHECK expression**:
```sql
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[2])
```

#### Policy 3: DELETE
- **Policy name**: Users can delete own resume
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **USING expression**:
```sql
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[2])
```

#### Policy 4: UPDATE
- **Policy name**: Users can update own resume
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **USING expression**:
```sql
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[2])
```

### Step 4: Verify Setup

To verify everything is working:

1. **Test the database table**:
   - Go to **Table Editor** in Supabase Dashboard
   - You should see the `opportunity_resumes` table
   - Check that RLS is enabled (shield icon should be visible)

2. **Test the storage bucket**:
   - Go to **Storage** in Supabase Dashboard
   - Click on the `resumes` bucket
   - Verify it's set to private (not public)
   - Check that all 4 RLS policies are listed

3. **Test the application**:
   - Start your development server: `npm run dev`
   - Sign in as a user with a @udel.edu email
   - Go to the Opportunities page
   - Try uploading a resume
   - Verify you can download and delete your resume

## How It Works

### File Storage Structure

Files are stored in Supabase Storage with the following path structure:
```
resumes/
  └── {opportunity_id}/
      └── {user_id}/
          └── {username}-{opportunity}-{timestamp}.{ext}
```

For example:
```
resumes/
  └── data-engineer-intern/
      └── 37ed6bef-51fa-486e-82c5-78ac8b67cff0/
          └── jdoe-data-engineer-intern-20231123104500.pdf
```

This structure ensures:
- Each opportunity has its own folder for easy bulk downloads
- Each user keeps a private subfolder enforced by storage RLS
- File names include the student's UD username, making them easy to identify
- Files are uniquely named with timestamps

### Database Schema

The `opportunity_resumes` table tracks metadata about uploaded resumes:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | References auth.users(id), CASCADE delete |
| `opportunity_id` | TEXT | ID of the opportunity the resume belongs to |
| `file_name` | TEXT | Original filename (e.g., "John_Doe_Resume.pdf") |
| `file_path` | TEXT | Storage path (e.g., "user-id/resume_123.pdf") |
| `file_size` | INTEGER | File size in bytes |
| `mime_type` | TEXT | MIME type (e.g., "application/pdf") |
| `uploaded_at` | TIMESTAMP | When the file was uploaded |

**Unique Constraint**: Each user can only have one resume per opportunity (`UNIQUE(user_id, opportunity_id)`).

### Security Features

1. **Row Level Security (RLS)**:
   - Users can only read, insert, update, and delete their own resume records
   - Enforced at the database level

2. **Storage RLS Policies**:
   - Users can only access files in their own folder
   - Files are stored in private buckets
   - Access is validated at the storage level

3. **File Validation**:
   - Only PDF, DOC, and DOCX files are allowed
   - Maximum file size is 5MB
   - Validation happens on the client side before upload

4. **Authenticated Access Only**:
   - All operations require a valid session
   - Email domain must be @udel.edu

## Troubleshooting

### Error: "Failed to upload resume"

**Possible causes**:
1. Storage bucket not created or incorrectly named
2. Storage RLS policies missing or incorrect
3. File size exceeds 5MB
4. Invalid file type

**Solutions**:
- Verify the bucket name is exactly `resumes`
- Check that all 4 storage RLS policies are configured
- Check browser console for specific error messages
- Try with a smaller PDF file first

### Error: "Failed to fetch resume"

**Possible causes**:
1. Database table not created
2. Database RLS policies incorrect
3. User not authenticated

**Solutions**:
- Verify the `opportunity_resumes` table exists
- Check that database RLS policies are enabled
- Ensure user is signed in with valid session

### Error: "Failed to delete resume"

**Possible causes**:
1. Storage RLS policies don't allow DELETE
2. Database RLS policies don't allow DELETE
3. File doesn't exist in storage

**Solutions**:
- Verify DELETE policy exists for storage
- Check database RLS policies
- Check Supabase logs for specific errors

### File uploads but not showing in UI

**Possible causes**:
1. Database insert failed but storage succeeded
2. React state not refreshing

**Solutions**:
- Check database to see if record exists
- Try refreshing the page
- Check browser console for errors

## File Size Limits

Current limits:
- **Client-side validation**: 5MB
- **Supabase free tier**: 1GB total storage
- **Supabase Pro tier**: 100GB total storage

To change the file size limit:
1. Update `MAX_FILE_SIZE` in `src/hooks/useOpportunityResumes.ts`
2. Update the validation message in `src/components/ResumeUploadModal.tsx`

## Future Enhancements

Possible improvements for the future:
- Support for LinkedIn profiles or portfolio URLs
- Resume parsing to extract skills
- Admin dashboard to view user resumes (with explicit consent)
- Email notifications when resume is uploaded
- Automatic resume expiration (e.g., after 1 year)
- Multiple resume versions per opportunity (version history)

## Support

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Check the browser console for errors
3. Verify all setup steps were completed
4. Contact dsi-info@udel.edu for assistance

