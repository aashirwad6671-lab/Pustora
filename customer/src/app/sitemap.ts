import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client (uses Service Role for sitemap generation)
// Falls back to anon key if service key is not set (anon can read public data)
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export const revalidate = 86400; // Regenerate sitemap once per day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';
  const now = new Date();

  // ── Static routes ────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/school`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/books`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/stationery`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/toys`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    const supabase = getServerSupabase();

    // ── Product pages ─────────────────────────────────────────
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // ── School landing pages ──────────────────────────────────
    const { data: schools } = await supabase
      .from('schools')
      .select('slug, updated_at')
      .eq('is_active', true);

    const schoolRoutes: MetadataRoute.Sitemap = (schools ?? []).map((s) => ({
      url: `${baseUrl}/school/${s.slug}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9, // High priority — key SEO pages
    }));

    // ── School + Class combo pages ────────────────────────────
    const { data: combos } = await supabase
      .from('combos')
      .select(`
        slug,
        updated_at,
        school_classes (
          class_slug,
          schools ( slug )
        )
      `)
      .eq('is_active', true);

    const comboRoutes: MetadataRoute.Sitemap = (combos ?? [])
      .map((c: any) => {
        const schoolSlug = c.school_classes?.schools?.slug;
        const classSlug = c.school_classes?.class_slug;
        if (!schoolSlug || !classSlug) return null;
        return {
          url: `${baseUrl}/school/${schoolSlug}/${classSlug}`,
          lastModified: new Date(c.updated_at),
          changeFrequency: 'monthly' as const,
          priority: 0.85, // Very high — exact keyword match pages
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;

    return [...staticRoutes, ...schoolRoutes, ...comboRoutes, ...productRoutes];
  } catch (err) {
    // If DB is unavailable during build, return static routes only
    console.warn('[sitemap] Supabase fetch failed, using static routes only:', err);
    return staticRoutes;
  }
}
