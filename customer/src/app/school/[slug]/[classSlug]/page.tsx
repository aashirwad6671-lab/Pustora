// /school/[slug]/[classSlug]/page.tsx
// SSR page: School + Class → shows combo with all products
// URL: /school/cms/class-8 | /school/la-martiniere/class-10

export const runtime = 'edge';

// ──────────────────────────────────────────────────────────────
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import JsonLd from '../../../../components/JsonLd';
import {
  getSchoolClassBySlug,
  getComboItems,
  getAllSchools,
  getClassesForSchool,
} from '../../../../services/schoolService';

// ── Static generation for known school/class combos ───────────
export async function generateStaticParams() {
  try {
    const schools = await getAllSchools();
    const params: { slug: string; classSlug: string }[] = [];

    for (const school of schools) {
      const classes = await getClassesForSchool(school.id);
      for (const cls of classes) {
        params.push({ slug: school.slug, classSlug: cls.class_slug });
      }
    }

    return params;
  } catch {
    // Fallback common combinations if DB is unavailable at build time
    const commonClasses = [
      'class-1','class-2','class-3','class-4','class-5','class-6',
      'class-7','class-8','class-9','class-10','class-11','class-12',
    ];
    const commonSchools = ['cms','la-martiniere','dps-lucknow'];
    return commonSchools.flatMap((slug) =>
      commonClasses.map((classSlug) => ({ slug, classSlug }))
    );
  }
}

// ── SSR Metadata ───────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { slug: string; classSlug: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';
  const result = await getSchoolClassBySlug(params.slug, params.classSlug);

  if (!result) return { title: 'Combo Not Found | Pustora' };

  const { school, schoolClass } = result;
  const classDisplay = schoolClass.class_name;
  const streamSuffix = schoolClass.stream ? ` (${schoolClass.stream})` : '';

  const title = `${school.short_name} ${classDisplay}${streamSuffix} Complete Book Set Lucknow — Order Online | Pustora`;
  const description = `Buy the complete ${school.name} ${classDisplay}${streamSuffix} book set in Lucknow. Original ${school.board} textbooks, stationery combo, and all required books. Fast home delivery.`;
  const pageUrl = `${siteUrl}/school/${school.slug}/${params.classSlug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
    },
    keywords: [
      `${school.short_name} ${classDisplay} books Lucknow`,
      `${school.name} ${classDisplay} book list`,
      `${school.short_name} ${classDisplay} book set`,
      `${school.board} ${classDisplay} books online`,
      `buy ${school.short_name} books Lucknow`,
      `${classDisplay} book set delivery Lucknow`,
      `${school.short_name} ${classDisplay}${streamSuffix} combo`,
    ],
  };
}

// ── Page Component ─────────────────────────────────────────────
export default async function SchoolClassPage({
  params,
}: {
  params: { slug: string; classSlug: string };
}) {
  const result = await getSchoolClassBySlug(params.slug, params.classSlug);
  if (!result) notFound();

  const { school, schoolClass, combos } = result;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';
  const classDisplay = schoolClass.class_name;
  const streamSuffix = schoolClass.stream ? ` · ${schoolClass.stream}` : '';

  // Fetch items for each combo
  const combosWithItems = await Promise.all(
    combos.map(async (combo) => {
      try {
        const items = await getComboItems(combo.id);
        return { combo, items };
      } catch {
        return { combo, items: [] };
      }
    })
  );

  // Build ItemList JSON-LD
  const allProducts = combosWithItems
    .flatMap(({ items }) => items)
    .map((item) => item.products)
    .filter(Boolean);

  return (
    <>
      {/* ── Structured Data ── */}
      <JsonLd
        type="BreadcrumbList"
        data={[
          { name: 'Home', url: siteUrl },
          { name: 'Schools', url: `${siteUrl}/school` },
          { name: school.name, url: `${siteUrl}/school/${school.slug}` },
          { name: classDisplay, url: `${siteUrl}/school/${school.slug}/${params.classSlug}` },
        ]}
      />
      {allProducts.length > 0 && (
        <JsonLd
          type="ItemList"
          data={{
            name: `${school.short_name} ${classDisplay} Book Set`,
            items: allProducts.map((p: any) => ({
              name: p.name,
              url: `${siteUrl}/product/${p.slug || p.id}`,
              image: p.image_url || undefined,
              price: p.price,
            })),
          }}
        />
      )}

      <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Home</Link>
          <span>›</span>
          <Link href="/school" style={{ color: 'var(--primary)', fontWeight: 600 }}>Schools</Link>
          <span>›</span>
          <Link href={`/school/${school.slug}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{school.short_name}</Link>
          <span>›</span>
          <span style={{ color: 'var(--deep-text)', fontWeight: 700 }}>{classDisplay}</span>
        </nav>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.875rem)', fontFamily: 'Sora, sans-serif', color: 'var(--deep-text)', marginBottom: '8px' }}>
            {school.name}
            <span style={{ color: 'var(--primary)' }}> {classDisplay}</span>
            {schoolClass.stream && (
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginLeft: '8px' }}>({schoolClass.stream})</span>
            )}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9375rem' }}>
            Complete book list and combos for {school.board} curriculum · Academic Year {schoolClass.academic_year}
          </p>
        </div>

        {/* ── No combos state ── */}
        {combosWithItems.length === 0 && (
          <div className="stitch-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Combo Being Curated</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 24px' }}>
              We are finalising the exact book list for {school.name} {classDisplay}. Browse individual books below.
            </p>
            <Link href="/?category=books" className="stitch-btn">Browse All Books</Link>
          </div>
        )}

        {/* ── Combo Cards ── */}
        {combosWithItems.map(({ combo, items }) => (
          <section key={combo.id} aria-label={combo.name} style={{ marginBottom: '40px' }}>
            {/* Combo Header */}
            <div className="stitch-card" style={{ background: 'var(--primary-gradient)', color: '#fff', marginBottom: '20px', padding: '1.5rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '1.125rem', marginBottom: '6px', fontFamily: 'Sora, sans-serif' }}>
                    {combo.name}
                  </h2>
                  {combo.description && (
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>{combo.description}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Sora, sans-serif' }}>
                    ₹{combo.total_price.toLocaleString('en-IN')}
                  </div>
                  {combo.mrp_total > combo.total_price && (
                    <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', textDecoration: 'line-through' }}>
                      MRP ₹{combo.mrp_total.toLocaleString('en-IN')}
                    </div>
                  )}
                  {combo.savings_pct > 0 && (
                    <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 8px', marginTop: '4px', display: 'inline-block', fontWeight: 700 }}>
                      {combo.savings_pct}% OFF
                    </div>
                  )}
                </div>
              </div>
              {/* Add Entire Combo to Cart — links to cart page with combo ID */}
              <div style={{ marginTop: '20px' }}>
                <Link
                  href={`/cart?combo=${combo.id}`}
                  className="stitch-btn"
                  style={{ background: '#fff', color: 'var(--primary)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  id={`btn-add-combo-${combo.id}`}
                >
                  🛒 Add Full Combo to Cart
                </Link>
              </div>
            </div>

            {/* Product list inside combo */}
            {items.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', marginBottom: '14px' }}>
                  {items.length} Items Included
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((item) => {
                    const product = item.products;
                    if (!product) return null;
                    return (
                      <div
                        key={item.id}
                        className="stitch-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px' }}
                      >
                        {/* Product thumbnail */}
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                          background: (product as any).image_url || 'var(--primary-gradient)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.25rem',
                        }}>
                          {!(product as any).image_url && '📚'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--deep-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(product as any).name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                            {(product as any).brand} · Qty: {item.quantity}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9375rem' }}>
                            ₹{(product as any).price}
                          </div>
                          {(product as any).slug && (
                            <Link
                              href={`/product/${(product as any).slug}`}
                              style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        ))}

      </div>
    </>
  );
}
