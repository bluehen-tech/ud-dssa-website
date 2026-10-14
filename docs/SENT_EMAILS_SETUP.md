# Sent Emails Table Setup

Run the following SQL in your Supabase Dashboard → SQL Editor to create the `sent_emails` table.

## Create Table

```sql
CREATE TABLE sent_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  subject text NOT NULL,
  body_markdown text NOT NULL,
  email_type text NOT NULL DEFAULT 'newsletter',
  sender_label text,
  recipient_count int DEFAULT 0,
  sent_by uuid REFERENCES auth.users(id),
  sent_at timestamptz DEFAULT now(),
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sent_emails_slug ON sent_emails(slug);
CREATE INDEX idx_sent_emails_sent_at ON sent_emails(sent_at DESC);
```

## Row Level Security

```sql
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can read published emails (needed for public /emails/[slug] pages)
CREATE POLICY "Public can read published emails"
  ON sent_emails FOR SELECT
  USING (published = true);

-- Admins can read all emails (including unpublished)
CREATE POLICY "Admins can read all emails"
  ON sent_emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- Admins can insert emails
CREATE POLICY "Admins can insert emails"
  ON sent_emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );

-- Admins can update emails (publish/unpublish)
CREATE POLICY "Admins can update emails"
  ON sent_emails FOR UPDATE
  TO authenticated
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

-- Admins can delete emails
CREATE POLICY "Admins can delete emails"
  ON sent_emails FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_flag = true
    )
  );
```
