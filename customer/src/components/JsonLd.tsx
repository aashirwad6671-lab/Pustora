// ============================================================
// JsonLd.tsx — Reusable Structured Data Component
// Renders <script type="application/ld+json"> tags for Google
// ============================================================
// Usage:
//   <JsonLd type="Product" data={{ name: '...', price: 99 }} />
//   <JsonLd type="BreadcrumbList" data={[...]} />
// ============================================================

import React from 'react';

// ── Type Definitions ────────────────────────────────────────

interface ProductJsonLdProps {
  type: 'Product';
  data: {
    name: string;
    description?: string;
    image?: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    brand?: string;
    sku?: string;
    url?: string;
    reviewCount?: number;
    ratingValue?: number;
  };
}

interface BreadcrumbJsonLdProps {
  type: 'BreadcrumbList';
  data: Array<{ name: string; url: string }>;
}

interface WebPageJsonLdProps {
  type: 'WebPage';
  data: {
    name: string;
    description?: string;
    url: string;
    breadcrumb?: Array<{ name: string; url: string }>;
  };
}

interface ItemListJsonLdProps {
  type: 'ItemList';
  data: {
    name: string;
    items: Array<{ name: string; url: string; image?: string; price?: number }>;
  };
}

type JsonLdProps =
  | ProductJsonLdProps
  | BreadcrumbJsonLdProps
  | WebPageJsonLdProps
  | ItemListJsonLdProps;

// ── JSON-LD Builders ─────────────────────────────────────────

function buildProduct(data: ProductJsonLdProps['data']) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    ...(data.description && { description: data.description }),
    ...(data.image && { image: [data.image] }),
    ...(data.brand && {
      brand: { '@type': 'Brand', name: data.brand },
    }),
    ...(data.sku && { sku: data.sku }),
    ...(data.url && { url: data.url }),
    offers: {
      '@type': 'Offer',
      url: data.url || siteUrl,
      priceCurrency: data.currency || 'INR',
      price: data.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      availability: `https://schema.org/${data.availability || 'InStock'}`,
      seller: { '@type': 'Organization', name: 'Pustora' },
    },
    ...(data.ratingValue && data.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.ratingValue,
        reviewCount: data.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

function buildBreadcrumb(items: BreadcrumbJsonLdProps['data']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildWebPage(data: WebPageJsonLdProps['data']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: data.name,
    ...(data.description && { description: data.description }),
    url: data.url,
    ...(data.breadcrumb && {
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: data.breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    }),
  };
}

function buildItemList(data: ItemListJsonLdProps['data']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: data.name,
    itemListElement: data.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
      ...(item.price && {
        offers: {
          '@type': 'Offer',
          price: item.price,
          priceCurrency: 'INR',
        },
      }),
    })),
  };
}

// ── Component ───────────────────────────────────────────────

export default function JsonLd(props: JsonLdProps) {
  let schema: object;

  switch (props.type) {
    case 'Product':
      schema = buildProduct(props.data);
      break;
    case 'BreadcrumbList':
      schema = buildBreadcrumb(props.data);
      break;
    case 'WebPage':
      schema = buildWebPage(props.data);
      break;
    case 'ItemList':
      schema = buildItemList(props.data);
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
