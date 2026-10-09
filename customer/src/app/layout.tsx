import type { Metadata, Viewport } from 'next';
import './globals.css';

// ── Site-wide constants ──────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xyzgrocery.in';
const SITE_NAME = 'XYZ Grocery';
const DEFAULT_TITLE = 'XYZ Grocery — Fresh Groceries Delivered in 10-15 Minutes';
const DEFAULT_DESCRIPTION =
  'Order fresh dairy, atta, dal, cooking oil, snacks, cold drinks, cleaning essentials and household needs with instant 10-15 minute delivery by XYZ Grocery.';

// ── Viewport (separate export required in Next.js 14 App Router) ──
export const viewport: Viewport = {
  themeColor: '#0C831F',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// ── Default Metadata (overridden per page via generateMetadata) ──
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,

  // ── Keywords ──
  keywords: [
    'grocery delivery', 'instant grocery 10 mins', 'XYZ Grocery',
    'atta rice dal delivery', 'fresh milk bread eggs', 'snacks and chips delivery',
    'quick commerce grocery', 'supermarket delivery Lucknow',
  ],

  // ── Canonical & alternates ──
  alternates: {
    canonical: SITE_URL,
    languages: { 'en-IN': SITE_URL },
  },

  // ── Open Graph ──
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'XYZ Grocery — Groceries Delivered in 10-15 Minutes',
      },
    ],
  },

  // ── Twitter / X Card ──
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },

  // ── PWA / App ──
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Verification (add your actual tokens when live) ──
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },

  // ── App icons ──
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-96x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/icons/icon-192x192.png',sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

// ── Organization JSON-LD (site-wide, rendered in every page) ──
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'XYZ Grocery',
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  description: DEFAULT_DESCRIPTION,
  areaServed: {
    '@type': 'City',
    name: 'Lucknow',
    sameAs: 'https://en.wikipedia.org/wiki/Lucknow',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi'],
  },
  sameAs: [
    'https://www.instagram.com/xyzgrocery',
    'https://twitter.com/xyzgrocery',
  ],
};

import AuthProvider from '../components/AuthProvider';

// ── Root Layout ──────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        {/* ── Preconnect to critical third-party origins ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ── Organization JSON-LD (appears on every page) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
