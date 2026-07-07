/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Cloudflare Pages compatibility ──────────────────────────
  // Use 'standalone' so Cloudflare's adapter can wrap the build.
  // Switch to 'export' only if you want a fully static site (no SSR).
  output: 'standalone',

  // ── Image optimisation ───────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
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

  // ── Security & caching headers ───────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Immutable cache for all static assets
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Short cache for API routes so Supabase data stays fresh
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },

  // ── Redirects ────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect legacy /product/[uuid] to /product/[slug] if needed
      // (add more as the app grows)
    ];
  },
};

module.exports = nextConfig;
