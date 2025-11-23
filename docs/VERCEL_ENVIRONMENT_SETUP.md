# Vercel Environment Setup for Magic Links

This guide explains how to configure magic links to work with Vercel preview deployments, localhost, and production.

## Overview

The application uses environment-aware URL detection to automatically work in:
- **Local Development:** `http://localhost:3001`
- **Vercel Preview Deployments:** `https://*-your-team.vercel.app`
- **Production:** `https://bluehen-dssa.org`

## Implementation

### 1. URL Helper Function

The `src/lib/get-url.ts` file provides environment-aware URL detection:

```typescript
export function getURL(): string {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Production site URL
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Vercel preview URL (auto-set)
    'http://localhost:3001/' // Local development fallback

  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  return url
}
```

**Priority:**
1. `NEXT_PUBLIC_SITE_URL` (if set) - Use for production
2. `NEXT_PUBLIC_VERCEL_URL` (auto-set by Vercel) - Use for preview deployments
3. `http://localhost:3001/` - Fallback for local development

### 2. Environment Variables

#### Local Development (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Leave NEXT_PUBLIC_SITE_URL empty for local development
# Will automatically use localhost:3001
```

#### Vercel Production Environment

In Vercel Dashboard → **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_SITE_URL=https://bluehen-dssa.org
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** `NEXT_PUBLIC_VERCEL_URL` is automatically set by Vercel for preview deployments - don't set it manually.

#### Vercel Preview Deployments

No additional configuration needed! Vercel automatically sets `NEXT_PUBLIC_VERCEL_URL` for preview deployments, and the code will use it automatically.

### 3. Supabase Dashboard Configuration

#### Redirect URLs

Add these patterns to **Authentication** → **URL Configuration** → **Redirect URLs**:

```
# Local development
http://localhost:3000/**
http://localhost:3001/**

# Vercel preview deployments (replace with your team/account slug)
https://*-your-team.vercel.app/**

# Production
https://bluehen-dssa.org/login
https://bluehen-dssa.org/auth/confirm
```

**Wildcard Pattern (`**`):**
- Allows all paths under that domain
- Useful for preview deployments where URLs change
- Example: `https://*-your-team.vercel.app/**` matches:
  - `https://ud-dssa-website-git-main-your-team.vercel.app/login`
  - `https://ud-dssa-website-abc123-your-team.vercel.app/auth/confirm`
  - Any other preview URL under your Vercel account

#### Site URL

Set to your production domain:
```
https://bluehen-dssa.org
```

**Note:** This is used in email templates. The code dynamically determines the correct URL for redirects.

### 4. How It Works

#### Local Development
1. `NEXT_PUBLIC_SITE_URL` is not set
2. `NEXT_PUBLIC_VERCEL_URL` is not set (not on Vercel)
3. Falls back to `http://localhost:3001/`
4. Magic link redirects to `http://localhost:3001/login`

#### Vercel Preview Deployment
1. `NEXT_PUBLIC_SITE_URL` is not set (only set in production)
2. `NEXT_PUBLIC_VERCEL_URL` is automatically set by Vercel (e.g., `https://ud-dssa-website-abc123.vercel.app`)
3. Uses `NEXT_PUBLIC_VERCEL_URL`
4. Magic link redirects to `https://ud-dssa-website-abc123.vercel.app/login`

#### Production
1. `NEXT_PUBLIC_SITE_URL` is set to `https://bluehen-dssa.org`
2. Uses `NEXT_PUBLIC_SITE_URL`
3. Magic link redirects to `https://bluehen-dssa.org/login`

## Testing

### Test Local Development
1. Start dev server: `npm run dev`
2. Go to `http://localhost:3001/login`
3. Request magic link
4. Check email - link should point to `http://localhost:3001/auth/confirm`

### Test Vercel Preview
1. Push to a branch (creates preview deployment)
2. Go to preview URL (e.g., `https://ud-dssa-website-abc123.vercel.app/login`)
3. Request magic link
4. Check email - link should point to preview URL

### Test Production
1. Deploy to production
2. Go to `https://bluehen-dssa.org/login`
3. Request magic link
4. Check email - link should point to `https://bluehen-dssa.org/auth/confirm`

## Troubleshooting

### Magic Link Points to Wrong URL

**Check:**
1. Environment variables are set correctly in Vercel
2. `NEXT_PUBLIC_SITE_URL` is only set in production environment
3. Supabase redirect URLs include the correct patterns

### Preview Deployments Not Working

**Check:**
1. Wildcard pattern in Supabase matches your Vercel preview URLs
2. Pattern format: `https://*-your-team.vercel.app/**`
3. Replace `your-team` with your actual Vercel team/account slug

### Localhost Not Working

**Check:**
1. `.env.local` doesn't have `NEXT_PUBLIC_SITE_URL` set (or it's set to localhost)
2. Supabase redirect URLs include `http://localhost:3001/**`
3. Dev server is running on port 3001

## Reference

- [Supabase Vercel Preview URLs Documentation](https://supabase.com/docs/guides/auth/auth-helpers/nextjs#vercel-preview-urls)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

