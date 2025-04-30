/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sanity/ui', '@sanity/icons', 'sanity', 'framer-motion'],
};

module.exports = nextConfig; 