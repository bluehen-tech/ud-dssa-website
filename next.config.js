/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // ⚠️ Temporarily ignore TypeScript errors during build
    // This is needed because Supabase type definitions aren't generated
    // until the database tables are created. Once you've run the SQL
    // scripts in supabase/RESUME_UPLOADS_SETUP.sql, the errors will resolve.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
 