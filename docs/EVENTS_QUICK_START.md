# Events Feature - Quick Start Guide

## 🎉 What Was Created

A complete Events management system has been added to your UD-DSSA website with the following features:

### For All Users (Authenticated)
- ✅ View all upcoming events
- ✅ See event details, dates, and descriptions
- ✅ Download event flyers (PDFs)
- ✅ Access event registration links

### For Admin Users
- ✅ Add new events with details
- ✅ Upload PDF flyers (max 5MB)
- ✅ Delete events (and associated flyers)
- ✅ Full CRUD operations

### For Non-Authenticated Users
- ✅ See events page with sign-in prompt
- ✅ Cannot view event details until signed in

---

## 📁 Files Created/Modified

### New Files
1. **`src/app/events/page.tsx`** - Main events page with admin management
2. **`src/types/event.ts`** - TypeScript type definitions for events
3. **`docs/EVENTS_SUPABASE_SETUP.md`** - Detailed Supabase setup instructions

### Modified Files
1. **`src/components/layout/Header.tsx`** - Added "Events" link between "Home" and "Opportunities"

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Database Table

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

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

-- Create indexes
CREATE INDEX idx_events_event_date ON events(event_date DESC);
CREATE INDEX idx_events_created_by ON events(created_by);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT USING (true);

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```

5. Click **Run** to execute the SQL

### Step 2: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Configure:
   - **Name**: `events`
   - **Public bucket**: ✅ **CHECK THIS BOX** (important!)
   - Click **Create bucket**

### Step 3: Set Storage Policies

After creating the bucket, go to its **Policies** tab and run this SQL:

```sql
-- Allow anyone to read/download flyers
CREATE POLICY "Public read access for event flyers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'events');

-- Allow admins to upload flyers
CREATE POLICY "Admins can upload event flyers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'events' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- Allow admins to delete flyers
CREATE POLICY "Admins can delete event flyers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'events' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```

### Step 4: Test It Out

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. You should see **"Events"** in the header navigation between "Home" and "Opportunities"

4. Sign in with your @udel.edu admin account

5. Go to `/events` and try adding an event!

---

## 🔧 Troubleshooting

### "new row violates row-level security policy"

**Problem**: You're not set as an admin in the database.

**Solution**: Run this SQL to make yourself an admin:

```sql
-- Check your current status
SELECT id, email, admin_flag FROM profiles WHERE email = 'your-email@udel.edu';

-- Set yourself as admin
UPDATE profiles SET admin_flag = true WHERE email = 'your-email@udel.edu';
```

### Cannot Upload Files

**Problem**: Storage bucket policies not set correctly.

**Solution**: 
1. Verify the bucket is **public** (Storage → events → Settings)
2. Re-run the storage policies from Step 3 above
3. Check policies exist: `SELECT * FROM storage.policies WHERE bucket_id = 'events';`

### Flyer URLs Not Working

**Problem**: Bucket is not public.

**Solution**:
1. Go to Storage → events bucket
2. Click Settings (gear icon)
3. Ensure **"Public bucket"** is checked
4. Save changes

---

## 📋 Features Overview

### Events Page (`/events`)

**For Authenticated Users:**
- View all events in a clean card layout
- See event title, description, date/time
- Download PDF flyers (if available)
- Click event URLs for registration/more info

**For Admin Users (additional):**
- "Add New Event" button at top of page
- Form to create events with:
  - Title (required)
  - Description (required)
  - Date & Time (required)
  - Event URL (optional)
  - PDF Flyer upload (optional, max 5MB)
- Delete button on each event card
- Automatic flyer cleanup when deleting events

**For Non-Authenticated Users:**
- See sign-in prompt
- Cannot view events until signed in

---

## 🎨 User Interface

The Events page matches the design aesthetic of your Opportunities page:

- **Same color scheme**: Blue primary, clean cards
- **Responsive design**: Works on mobile and desktop
- **Loading states**: Spinner while data loads
- **Hover effects**: Smooth transitions and shadows
- **Admin controls**: Subtle, non-intrusive buttons
- **Icon system**: Uses Heroicons for consistency

---

## 🔒 Security

- ✅ **RLS enabled**: All database operations protected
- ✅ **Admin-only writes**: Only admins can add/delete events
- ✅ **Public reads**: Anyone can view events (after sign-in)
- ✅ **File validation**: Only PDFs, max 5MB
- ✅ **Automatic cleanup**: Deleting events removes associated flyers
- ✅ **Audit trail**: `created_by` and `created_at` tracked

---

## 📚 Additional Documentation

For more detailed information, see:
- **`docs/EVENTS_SUPABASE_SETUP.md`** - Complete Supabase configuration guide

---

## 🚀 Next Steps

1. **Run the SQL scripts** above to set up Supabase
2. **Test the Events page** at http://localhost:3000/events
3. **Add your first event** as an admin
4. **Deploy to production** when ready

---

## 💡 Tips

- **Event dates**: Use the datetime picker for consistent formatting
- **Flyer size**: Keep PDFs under 5MB for best performance
- **Event URLs**: Use full URLs (e.g., https://example.com)
- **Descriptions**: Can use line breaks for better formatting
- **Testing**: Test both admin and non-admin views

---

## 🎯 Future Enhancements

Consider adding these features later:
- Event categories/tags
- RSVP/registration tracking
- Email notifications for new events
- Calendar integration (iCal export)
- Event image banners
- Event capacity limits
- Past events archive

---

## ✅ Checklist

- [ ] Run database SQL (Step 1)
- [ ] Create storage bucket (Step 2)
- [ ] Set storage policies (Step 3)
- [ ] Verify admin status in profiles table
- [ ] Test adding an event
- [ ] Test uploading a flyer
- [ ] Test deleting an event
- [ ] Test on mobile view
- [ ] Ready for production! 🎉

