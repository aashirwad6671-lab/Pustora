/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Cloudflare Pages compatibility ──────────────────────────
  // 'export' produces a fully static site that Cloudflare Pages can serve.
  output: 'export',

  // Required for static export — disable Next.js image optimisation
  // (use a CDN or Cloudflare Images instead)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        // Supabase Storage CDN
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Supabase Storage (custom domain variant)
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
