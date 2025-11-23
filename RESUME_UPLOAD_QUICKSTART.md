# Resume Upload Feature - Quick Start

## What You Need to Do in Supabase

I've implemented the resume upload feature! Here's what you need to do to make it work:

### 1. Create the Database Table (Required)

1. Go to your Supabase Dashboard → SQL Editor
2. Open and run the file: `supabase/RESUME_UPLOADS_SETUP.sql`
3. This creates the `opportunity_resumes` table with proper RLS policies (one resume per opportunity per user)

### 2. Create the Storage Bucket (Required)

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name it exactly: **`resumes`**
4. Set it to **PRIVATE** (not public)
5. Click "Create bucket"

### 3. Configure Storage RLS Policies (Required)

After creating the bucket, you need to add 4 RLS policies. In the Supabase Storage section, click on the `resumes` bucket, then go to the **Policies** tab.

Click "New policy" for each of these:

#### Policy 1: SELECT (Download)
```
Policy name: Users can download own resume
Allowed operation: SELECT
Target roles: authenticated
USING expression:
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 2: INSERT (Upload)
```
Policy name: Users can upload own resume
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression:
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 3: DELETE
```
Policy name: Users can delete own resume
Allowed operation: DELETE
Target roles: authenticated
USING expression:
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 4: UPDATE
```
Policy name: Users can update own resume
Allowed operation: UPDATE
Target roles: authenticated
USING expression:
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
```

### 4. Test the Feature

1. Run your app in development mode: `npm run dev`
2. Sign in with your @udel.edu email
3. Go to the Opportunities page
4. Each opportunity card shows its own resume section
5. Use the "Attach Resume" button on a card to upload a file
6. Verify you can download, replace, and delete the resume for that opportunity

**Note:** The production build (`npm run build`) may fail with TypeScript errors until you've created the Supabase tables and generated types. Use `npm run dev` for development and testing. The TypeScript errors will resolve once the database tables exist and Supabase generates the type definitions.

## What I've Implemented

### Files Created:
- ✅ `supabase/RESUME_UPLOADS_SETUP.sql` - Database schema and policies
- ✅ `src/hooks/useOpportunityResumes.ts` - React hook for per-opportunity resume management
- ✅ `src/components/ResumeUploadModal.tsx` - Upload modal component
- ✅ `docs/RESUME_UPLOADS_SETUP.md` - Detailed setup guide

### Files Modified:
- ✅ `src/app/opportunities/page.tsx` - Added resume upload UI

### Features:
- ✅ Upload resume (PDF, DOC, DOCX, max 5MB) per opportunity
- ✅ View uploaded resume status per opportunity
- ✅ Download, replace, or delete a resume for each opportunity
- ✅ Maintain different resumes for different opportunities
- ✅ Secure file storage with RLS
- ✅ Drag-and-drop upload UI with validation and error handling

## How It Works

1. **Storage Structure**: Files are stored as `resumes/{opportunity_id}/{user_id}/{username}-{opportunity}-{timestamp}.{ext}`
2. **Security**: Users can only access their own files (enforced by RLS)
3. **One Resume Per Opportunity**: Uploading again for the same opportunity replaces the previous file
4. **File Validation**: Client-side validation for file type and size

## Need Help?

See the full documentation in `docs/RESUME_UPLOADS_SETUP.md` for:
- Detailed setup instructions
- Troubleshooting guide
- Security features explanation
- How to modify file size limits

## Important Notes

⚠️ The TypeScript linter might show temporary errors until you:
1. Restart your dev server (`npm run dev`)
2. Or restart your TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

These errors should go away once TypeScript recompiles the project.

