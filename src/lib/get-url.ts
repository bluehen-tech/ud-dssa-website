/**
 * Get the current site URL based on environment
 * 
 * Supports:
 * - Local development (localhost:3000, localhost:3001)
 * - Vercel preview deployments (*.vercel.app)
 * - Production (bluehen-dssa.org)
 * 
 * Based on Supabase documentation for Vercel deployments:
 * https://supabase.com/docs/guides/auth/auth-helpers/nextjs#vercel-preview-urls
 */
export function getURL(): string {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3001/' // Default to localhost:3001 for local development

  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`

  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`

  return url
}

/**
 * Get the base URL without trailing slash (for email templates)
 */
export function getBaseURL(): string {
  const url = getURL()
  return url.endsWith('/') ? url.slice(0, -1) : url
}

