/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Cloudflare Pages compatibility ──────────────────────────
  // 'standalone' works with @cloudflare/next-on-pages adapter (SSR supported).
  // Do NOT use 'export' — the app has dynamic routes (category/[id], product/[slug], etc.)
  // that depend on Supabase data and cannot be statically pre-rendered.
  output: 'standalone',

  // ── Image optimisation ───────────────────────────────────────
  images: {
    unoptimized: true, // required for Cloudflare Pages
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;

