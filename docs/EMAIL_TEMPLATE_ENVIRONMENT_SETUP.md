# Email Template Environment Setup

## Problem

You need the magic link to work in both:
- **Development:** `http://localhost:3001`
- **Production:** `https://bluehen-dssa.org`

But `{{ .SiteURL }}` is set in Supabase Dashboard and would need to be changed manually.

## Solution: Use {{ .SiteURL }} (Simple & Reliable)

**Important:** Email clients require **absolute URLs** (with full domain). 

**Note:** The `replace` function may not be available in Supabase's Go templates, so we'll use `{{ .SiteURL }}` which is reliable and works consistently.

### Template (Recommended - Simple & Works)

```html
<h2>Log in to Blue Hen DSSA</h2>

<p>Your secure login link is ready:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
  </a>
</p>

<p>If you didn't request this link, you can ignore this email.</p>
```

**How It Works:**
- `{{ .SiteURL }}` is set in Supabase Dashboard → **Authentication** → **URL Configuration**
- For development: Set to `http://localhost:3001`
- For production: Set to `https://bluehen-dssa.org`
- Simple, reliable, no template function dependencies

**Key Points:**
- Uses `{{ .SiteURL }}` - Simple and reliable
- Must change Site URL in Supabase Dashboard when switching environments
- Link text shows full URL for user visibility
- Works consistently across all email clients

### How It Works

**The Problem:**
- `{{ .SiteURL }}` is set in Supabase Dashboard → **Authentication** → **URL Configuration**
- This is a single value, so it can't automatically switch between localhost and production
- You need to either:
  1. Change it manually when switching environments, OR
  2. Use separate Supabase projects for dev/prod, OR
  3. Set it to production and use a workaround for localhost

**The Reality:**
- Email links **must** use absolute URLs (with full domain)
- Relative URLs don't work in emails (no base URL context)
- `{{ .SiteURL }}` gets replaced by Supabase with whatever is configured in dashboard

---

## Solutions for Multiple Environments

### Option 1: Manual Site URL Change (Simplest)

Change the Site URL in Supabase Dashboard when switching environments:

1. **For Development:**
   - Supabase Dashboard → **Authentication** → **URL Configuration**
   - Set **Site URL:** `http://localhost:3001` (or `http://localhost:3000`)

2. **For Production:**
   - Same settings
   - Set **Site URL:** `https://bluehen-dssa.org`

**Pros:** Simple, works immediately
**Cons:** Must remember to change when switching environments

### Option 2: Separate Supabase Projects (Recommended for Production)

Use different Supabase projects for development and production:

- **Development Project:** Site URL = `http://localhost:3001`
- **Production Project:** Site URL = `https://bluehen-dssa.org`

**Pros:** 
- No manual switching needed
- Isolated environments
- Production settings never accidentally changed

**Cons:** 
- Need to manage two projects
- Environment variables need to be different per environment

### Option 3: Set to Production, Use ngrok/Tunneling for Localhost

Set Site URL to production, use a tunnel for localhost testing:

1. Set **Site URL:** `https://bluehen-dssa.org` (production)
2. For localhost testing, use a tunnel service (ngrok, Cloudflare Tunnel, etc.)
3. Add tunnel URL to redirect URLs

**Pros:** Production always works, localhost accessible via tunnel
**Cons:** Requires tunnel setup, more complex

### Option 2: Use ConfirmationURL (Implicit Flow)

You could switch to implicit flow and use `{{ .ConfirmationURL }}`:

```html
<a href="{{ .ConfirmationURL }}">Log In</a>
```

**But:** This requires changing your code to use implicit flow instead of PKCE flow.

**Pros:** Automatically handles all URLs
**Cons:** Requires code changes, less secure than PKCE

### Option 3: Relative URL (Recommended) ✅

Use relative URL as shown above - works in all environments automatically.

**Pros:** 
- Works in both dev and prod without changes
- No code changes needed
- Still uses PKCE flow

**Cons:** None!

---

## Template Options

### Option 1: Simple Clickable Link (Shows Full URL) ✅ Recommended

```html
<h2>Log in to Blue Hen DSSA</h2>

<p>Your secure login link is ready:</p>

<p>
  <a href="/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
  </a>
</p>

<p>If you didn't request this link, you can ignore this email.</p>
```

**Pros:** 
- Shows the full URL, users can see where they're going
- Link works on any domain (localhost:3000, localhost:3001, bluehen-dssa.org)
- Automatically adapts based on where email is opened
- Users can copy/paste the URL if needed

**Cons:** Long URL might wrap awkwardly (but email clients usually handle this)

---

### Option 2: Styled Link with URL Below

```html
<h2>Log in to Blue Hen DSSA</h2>

<p>Your secure login link is ready:</p>

<p>
  <a 
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
    style="
      color: #00539F;
      text-decoration: underline;
    "
  >
    Click here to log in
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="font-size: 12px; color: #666; word-break: break-all;">
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
</p>

<p>If you didn't request this link, you can ignore this email.</p>
```

**Pros:** Clean link + full URL for copy/paste, works in all email clients
**Cons:** Slightly longer template

---

### Option 3: Styled Button (Most Professional)

```html
<h2>Log in to Blue Hen DSSA</h2>

<p>Your secure login link is ready:</p>

<p>
  <a 
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
    style="
      display: inline-block;
      padding: 12px 20px;
      background-color: #00539F;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    "
  >
    Log In
  </a>
</p>

<p>If you didn't request this link, you can ignore this email.</p>
```

**Pros:** Professional button style, matches your brand color (#00539F)
**Cons:** Some email clients may not support all CSS

---

**Key for all options:** Must use `{{ .SiteURL }}/auth/confirm` (absolute URL) - email clients require full URLs

---

## Supabase Dashboard Configuration

Even with relative URLs, you still need to configure redirect URLs:

### Development Redirect URLs:
```
http://localhost:3001/login
http://localhost:3001/auth/confirm
```

### Production Redirect URLs:
```
https://bluehen-dssa.org/login
https://bluehen-dssa.org/auth/confirm
```

**Note:** You can add BOTH sets of URLs to the same Supabase project. Supabase will accept redirects to any whitelisted URL.

---

## Testing

1. **Development:**
   - Request magic link on `localhost:3001`
   - Email link should work when clicked
   - Should redirect to `localhost:3001/auth/confirm`

2. **Production:**
   - Request magic link on `bluehen-dssa.org`
   - Email link should work when clicked
   - Should redirect to `bluehen-dssa.org/auth/confirm`

Both should work with the same template!

