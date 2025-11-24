# Supabase Setup for Opportunities Feature

This guide walks you through setting up the necessary Supabase database tables and storage buckets for the Opportunities admin feature.

## 1. Create Opportunities Table

Run the SQL file `supabase/OPPORTUNITIES_SETUP.sql` in your Supabase SQL Editor, or copy and paste the following:

```sql
-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('job', 'internship', 'project', 'research', 'event')),
  description TEXT NOT NULL,
  requirements TEXT[],
  location TEXT,
  remote BOOLEAN DEFAULT false,
  application_url TEXT,
  contact_email TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  tags TEXT[],
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_opportunities_posted_at ON opportunities(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);

-- Enable Row Level Security (RLS)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view opportunities
CREATE POLICY "Anyone can view opportunities"
  ON opportunities
  FOR SELECT
  USING (true);

-- RLS Policy: Only admins can insert opportunities
CREATE POLICY "Admins can insert opportunities"
  ON opportunities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- RLS Policy: Only admins can update opportunities
CREATE POLICY "Admins can update opportunities"
  ON opportunities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- RLS Policy: Only admins can delete opportunities
CREATE POLICY "Admins can delete opportunities"
  ON opportunities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunities_updated_at();
```

## 2. Create Storage Bucket for Opportunity Attachments

### Step 1: Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `opportunities`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `application/pdf`

5. Click **Create bucket**

### Step 2: Set Storage Policies

After creating the bucket, you need to set up storage policies. Go to the **Policies** tab for the `opportunities` bucket and add these policies:

#### Policy 1: Public Read Access

```sql
-- Allow anyone to read/download attachments
CREATE POLICY "Public read access for opportunity attachments"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'opportunities');
```

#### Policy 2: Admin Upload Access

```sql
-- Allow admins to upload attachments
CREATE POLICY "Admins can upload opportunity attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'opportunities' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```

#### Policy 3: Admin Delete Access

```sql
-- Allow admins to delete attachments
CREATE POLICY "Admins can delete opportunity attachments"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'opportunities' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```

## 3. Alternative: Run All Storage Policies via SQL Editor

If you prefer to run all storage policies via SQL, you can use this:

```sql
-- Public read access for opportunity attachments
CREATE POLICY "Public read access for opportunity attachments"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'opportunities');

-- Admins can upload opportunity attachments
CREATE POLICY "Admins can upload opportunity attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'opportunities' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- Admins can delete opportunity attachments
CREATE POLICY "Admins can delete opportunity attachments"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'opportunities' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```

## 4. Verification

### Verify Table Creation

Run this query to verify the table was created correctly:

```sql
SELECT * FROM opportunities LIMIT 1;
```

### Verify Storage Bucket

1. Go to **Storage** → **opportunities** bucket
2. Try uploading a test PDF file as an admin
3. Verify the file URL is publicly accessible

## 5. Usage in the Application

The Opportunities page (`/opportunities`) will:

- ✅ Display all opportunities to authenticated users
- ✅ Show sample opportunities to non-authenticated users (with sign-in prompt)
- ✅ Allow admins to add new opportunities
- ✅ Allow admins to edit existing opportunities
- ✅ Allow admins to delete opportunities (and their associated attachments)
- ✅ Allow admins to upload PDF attachments (stored in the `opportunities` bucket)
- ✅ Maintain all existing user features (resume uploads, applications)

## 6. File Structure

- **Opportunity attachments** are stored in: `opportunities/opportunity-attachments/{timestamp}-{sanitized-title}.pdf`
- **Public URLs** are generated automatically using Supabase Storage

## 7. Troubleshooting

### Issue: "new row violates row-level security policy"

**Solution**: Verify that your user has `admin_flag = true` in the `profiles` table:

```sql
-- Check your admin status
SELECT id, email, admin_flag FROM profiles WHERE id = auth.uid();

-- If needed, set yourself as admin (run as postgres/admin)
UPDATE profiles SET admin_flag = true WHERE email = 'your-email@udel.edu';
```

### Issue: Cannot upload files to storage

**Solution**: Verify the storage bucket is set to **public** and policies are correctly applied:

```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'opportunities';
```

### Issue: Opportunities not loading

**Solution**: Check that the table exists and has the correct structure:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
ORDER BY ordinal_position;
```

## 8. Admin Features

Once set up, admin users will see:

- **"+ Add New Opportunity"** button in the header
- **Edit** and **Delete** buttons on each opportunity card
- Full form for creating/editing opportunities with:
  - Title, Organization, Type
  - Description, Requirements (multiline)
  - Location, Remote option
  - Application URL, Contact Email
  - Posted Date, Deadline
  - Tags (comma-separated)
  - PDF Attachment upload

All changes are saved to Supabase and immediately reflected in the opportunities list.

