# Markdown Email System Setup

## Overview

The email composer now uses **Markdown** as the authoring format. AI generates markdown, the editor provides a toolbar for formatting, and the preview shows exactly what recipients will receive (including header and footer branding).

## Supabase Storage Bucket Setup

The image uploader requires an `email-images` bucket in Supabase Storage.

### 1. Create the bucket

1. Go to your Supabase dashboard → Storage
2. Click "New bucket"
3. Name: `email-images`
4. Public bucket: **Yes** (images need to be publicly accessible in emails)
5. File size limit: 5MB
6. Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

### 2. Set up RLS policies

Create the following policies on the `email-images` bucket:

**Allow authenticated users to upload:**
```sql
CREATE POLICY "Authenticated users can upload email images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-images');
```

**Allow public read access:**
```sql
CREATE POLICY "Public can view email images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-images');
```

### 3. Enable image transformations

Supabase Storage supports on-the-fly image resizing via URL params. This is enabled by default on Pro plans. The uploader uses URLs like:

```
https://<project>.supabase.co/storage/v1/render/image/public/email-images/filename.jpg?width=320
```

If image transformations aren't available on your plan, the images will still work at full resolution.

## Environment Variables

Add/update these in `.env.local` and Vercel:

```env
# Email sender (display name + no-reply address)
RESEND_FROM=DSSA Newsletter <no-reply@bluehen-dssa.org>

# Reply-to address (where replies actually go)
RESEND_REPLY_TO=dssa@udel.edu
```

## How It Works

1. **AI generates Markdown** -- the system prompt instructs the AI to output markdown with headings, bold, lists, emojis, and horizontal rules
2. **Editor** -- tabbed interface with Edit (markdown + toolbar) and Preview (rendered email)
3. **Preview** -- shows the exact email with DSSA header, rendered markdown body, and footer
4. **Send** -- markdown is converted to inline-styled HTML, wrapped in the email template, and sent via Resend
5. **Images** -- uploaded to Supabase Storage, resized on-the-fly, inserted as markdown `![alt](url)`

## Markdown Features Supported

- Headings (`#`, `##`, `###`)
- Bold (`**text**`) and italic (`*text*`)
- Bullet lists (`- item`) and numbered lists (`1. item`)
- Links (`[text](url)`)
- Images (`![alt](url)`)
- Horizontal rules (`---`)
- Blockquotes (`> text`)
- Emojis (unicode)
- Personalisation placeholder: `{name}`
