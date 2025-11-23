# Supabase Setup for Events Feature

This guide walks you through setting up the necessary Supabase database tables and storage buckets for the Events feature.

## 1. Create Events Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_url TEXT,
  flyer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX idx_events_event_date ON events(event_date DESC);
CREATE INDEX idx_events_created_by ON events(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view events (even non-authenticated users can be allowed if needed)
CREATE POLICY "Anyone can view events"
  ON events
  FOR SELECT
  USING (true);

-- RLS Policy: Only admins can insert events
CREATE POLICY "Admins can insert events"
  ON events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- RLS Policy: Only admins can update events
CREATE POLICY "Admins can update events"
  ON events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- RLS Policy: Only admins can delete events
CREATE POLICY "Admins can delete events"
  ON events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```

## 2. Create Storage Bucket for Event Flyers

### Step 1: Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `events`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `application/pdf`

5. Click **Create bucket**

### Step 2: Set Storage Policies

After creating the bucket, you need to set up storage policies. Go to the **Policies** tab for the `events` bucket and add these policies:

#### Policy 1: Public Read Access

```sql
-- Allow anyone to read/download flyers
CREATE POLICY "Public read access for event flyers"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'events');
```

#### Policy 2: Admin Upload Access

```sql
-- Allow admins to upload flyers
CREATE POLICY "Admins can upload event flyers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'events' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```

#### Policy 3: Admin Delete Access

```sql
-- Allow admins to delete flyers
CREATE POLICY "Admins can delete event flyers"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'events' AND
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
-- Public read access for event flyers
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Public read access for event flyers',
  'events',
  '(bucket_id = ''events'')',
  'SELECT'
);

-- Admins can upload event flyers
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Admins can upload event flyers',
  'events',
  '(bucket_id = ''events'' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.admin_flag = true))',
  'INSERT'
);

-- Admins can delete event flyers
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Admins can delete event flyers',
  'events',
  '(bucket_id = ''events'' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.admin_flag = true))',
  'DELETE'
);
```

## 4. Verification

### Verify Table Creation

Run this query to verify the table was created correctly:

```sql
SELECT * FROM events LIMIT 1;
```

### Verify Storage Bucket

1. Go to **Storage** → **events** bucket
2. Try uploading a test PDF file as an admin
3. Verify the file URL is publicly accessible

## 5. Usage in the Application

The Events page (`/events`) will:

- ✅ Display all events to authenticated users
- ✅ Show a sign-in prompt to non-authenticated users
- ✅ Allow admins to add new events
- ✅ Allow admins to upload PDF flyers (stored in the `events` bucket)
- ✅ Allow admins to delete events (and their associated flyers)

## 6. File Structure

- **Event flyers** are stored in: `events/event-flyers/{timestamp}-{random}.pdf`
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
SELECT * FROM storage.policies WHERE bucket_id = 'events';
```

### Issue: Flyer URLs not working

**Solution**: Verify the bucket is set to **public**:

1. Go to **Storage** → **events** bucket
2. Click the **Settings** (gear icon)
3. Ensure **Public bucket** is checked

## 8. Security Considerations

- ✅ Only admins can create, update, or delete events
- ✅ Only admins can upload or delete flyers
- ✅ Flyers are publicly accessible (anyone with the URL can view)
- ✅ File uploads are limited to PDF format and 5MB max size
- ✅ All operations are logged with `created_by` and `created_at` timestamps

## 9. Future Enhancements

Potential improvements for the future:

- Add event categories/tags
- Add RSVP/registration tracking
- Add event capacity limits
- Send email notifications for new events
- Add calendar integration (iCal/Google Calendar)
- Add image support for event banners (in addition to PDF flyers)

