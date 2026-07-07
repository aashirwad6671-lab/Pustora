// /product/[slug]/page.tsx  
// Handles SEO-friendly slug URLs (e.g., /product/apsara-platinum-pencils)
// Also handles legacy UUID URLs as fallback (resolves to slug and redirects)

export const runtime = 'edge';

// This is a SERVER COMPONENT wrapper that provides SSR metadata, then
// renders the existing client-side ProductDetailsPage.
// ──────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import JsonLd from '../../../components/JsonLd';
import ProductDetailsClient from './ProductDetailsClient';

// ── UUID detection regex ──────────────────────────────────────
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Supabase server client ─────────────────────────────────────
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ── Fetch product by slug OR uuid ──────────────────────────────
async function fetchProduct(slugOrId: string) {
  const supabase = getServerClient();
  const isUuid = UUID_REGEX.test(slugOrId);

  const query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  const { data, error } = await (isUuid
    ? query.eq('id', slugOrId)
    : query.eq('slug', slugOrId)
  ).single();

  if (error || !data) return null;
  return data as any;
}

// ── generateMetadata ───────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';
  const product = await fetchProduct(params.slug);

  if (!product) {
    return { title: 'Product Not Found | Pustora' };
  }

  // If accessed by UUID, canonical should still point to slug URL
  const canonicalSlug = product.slug || product.id;
  const pageUrl = `${siteUrl}/product/${canonicalSlug}`;

  const title = `${product.name} — ${product.brand} | Buy Online in Lucknow | Pustora`;
  const description = product.description
    ? `${product.description.slice(0, 155)}...`
    : `Buy ${product.name} by ${product.brand} online. Fast delivery in Lucknow. ₹${product.price}.`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: product.image_url && !product.image_url.startsWith('linear')
        ? [{ url: product.image_url, alt: product.name, width: 800, height: 800 }]
        : [],
    },
    keywords: [
      product.name, product.brand,
      `${product.name} price`, `buy ${product.name} online`,
      `${product.brand} stationery Lucknow`,
      product.grade_suitability || '',
      product.subject_tag || '',
    ].filter(Boolean),
  };
}

// ── Page Component ─────────────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';
  const product = await fetchProduct(params.slug);

  // If not found — let client handle 404 gracefully
  if (!product) {
    return <ProductDetailsClient slugOrId={params.slug} />;
  }

  // Redirect UUID requests to slug URL (301 permanent)
  const isUuid = UUID_REGEX.test(params.slug);
  if (isUuid && product.slug) {
    redirect(`/product/${product.slug}`);
  }

  const canonicalSlug = product.slug || product.id;

  return (
    <>
      {/* ── Product JSON-LD ── */}
      <JsonLd
        type="Product"
        data={{
          name: product.name,
          description: product.description || undefined,
          image:
            product.image_url && !product.image_url.startsWith('linear')
              ? product.image_url
              : undefined,
          price: product.price,
          currency: 'INR',
          availability: product.stock_quantity > 0 ? 'InStock' : 'OutOfStock',
          brand: product.brand,
          sku: product.id,
          url: `${siteUrl}/product/${canonicalSlug}`,
        }}
      />
      {/* ── Breadcrumb JSON-LD ── */}
      <JsonLd
        type="BreadcrumbList"
        data={[
          { name: 'Home', url: siteUrl },
          { name: product.category_id, url: `${siteUrl}/category/${product.category_id}` },
          { name: product.name, url: `${siteUrl}/product/${canonicalSlug}` },
        ]}
      />

      {/* ── Client Component (has cart, reviews, UI interactivity) ── */}
      <ProductDetailsClient slugOrId={canonicalSlug} initialProduct={product} />
    </>
  );
}
