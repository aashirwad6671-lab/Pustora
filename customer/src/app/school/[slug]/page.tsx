// /school/[slug]/page.tsx
// SSR page for a specific school — lists all available class combos
// URL: /school/cms | /school/la-martiniere | /school/dps-lucknow
// ──────────────────────────────────────────────────────────────
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import JsonLd from '../../../components/JsonLd';
import { getSchoolBySlug, getClassesForSchool, getAllSchools } from '../../../services/schoolService';

// ── Static generation for top schools ─────────────────────────
export async function generateStaticParams() {
  try {
    const schools = await getAllSchools();
    return schools.map((s) => ({ slug: s.slug }));
  } catch {
    // Fallback slugs if DB is unavailable at build time
    return [
      { slug: 'cms' }, { slug: 'la-martiniere' }, { slug: 'dps-lucknow' },
      { slug: 'jaipuria' }, { slug: 'loreto' }, { slug: 'colvin' },
    ];
  }
}

// ── SSR Metadata ───────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';
  const school = await getSchoolBySlug(params.slug);

  if (!school) {
    return { title: 'School Not Found | Pustora' };
  }

  const title = `${school.name} (${school.short_name}) Books & Stationery — Order Online | Pustora`;
  const description = `Get the complete ${school.name} book set, class-wise combos, and stationery delivered fast in Lucknow. Original ${school.board} books for all classes — LKG to Class 12.`;
  const pageUrl = `${siteUrl}/school/${school.slug}`;

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
      `${school.name} books`, `${school.short_name} book set Lucknow`,
      `${school.short_name} class books`, `${school.board} books Lucknow`,
      `${school.name} stationery`, 'school books delivery Lucknow',
      `order ${school.short_name} books online`,
    ],
  };
}

// ── Page Component ─────────────────────────────────────────────
export default async function SchoolPage({ params }: { params: { slug: string } }) {
  const school = await getSchoolBySlug(params.slug);
  if (!school) notFound();

  const classes = await getClassesForSchool(school.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';

  // Group classes by stream for Class 11/12
  const lowerClasses = classes.filter((c) => !c.stream);
  const streamClasses = classes.filter((c) => c.stream);
  const streams = Array.from(new Set(streamClasses.map((c) => c.stream)));

  return (
    <>
      {/* ── Structured Data ── */}
      <JsonLd
        type="BreadcrumbList"
        data={[
          { name: 'Home', url: siteUrl },
          { name: 'Schools', url: `${siteUrl}/school` },
          { name: school.name, url: `${siteUrl}/school/${school.slug}` },
        ]}
      />
      <JsonLd
        type="WebPage"
        data={{
          name: `${school.name} Books — Pustora`,
          description: `Class-wise book combos and stationery for ${school.name}, Lucknow`,
          url: `${siteUrl}/school/${school.slug}`,
        }}
      />

      <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Home</Link>
          <span>›</span>
          <Link href="/school" style={{ color: 'var(--primary)', fontWeight: 600 }}>Schools</Link>
          <span>›</span>
          <span style={{ color: 'var(--deep-text)', fontWeight: 700 }}>{school.name}</span>
        </nav>

        {/* ── School Hero Banner ── */}
        <div className="stitch-card" style={{ marginBottom: '40px', background: 'var(--primary-gradient)', color: '#fff', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* School Logo Placeholder */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', flexShrink: 0,
            }}>
              🏫
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', marginBottom: '6px', fontFamily: 'Sora, sans-serif' }}>
                {school.name}
              </h1>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {school.board}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  📍 {school.city}
                </span>
                {classes.length > 0 && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {classes.length} Classes Available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── No combos yet state ── */}
        {classes.length === 0 && (
          <div className="stitch-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Combos Coming Soon</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 24px' }}>
              We are curating the exact book list for {school.name}. Check back soon or browse our full catalog.
            </p>
            <Link href="/" className="stitch-btn">Browse All Books</Link>
          </div>
        )}

        {/* ── Class Grid (LKG–Class 10) ── */}
        {lowerClasses.length > 0 && (
          <section aria-label={`${school.short_name} class combos`} style={{ marginBottom: '40px' }}>
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <h2 className="section-title">📚 Select Your Class</h2>
              <span className="section-badge">{school.board} Curriculum</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
              {lowerClasses.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/school/${school.slug}/${cls.class_slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="stitch-card stitch-card-hover" style={{
                    padding: '1.5rem 1rem', textAlign: 'center',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '10px',
                  }}>
                    <span style={{ fontSize: '2rem' }}>📖</span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif' }}>
                      {cls.class_name}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      View Combo →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Stream Classes (Class 11/12) ── */}
        {streamClasses.length > 0 && (
          <section aria-label={`${school.short_name} Class 11 & 12 combos`}>
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <h2 className="section-title">🎓 Class 11 & 12 — By Stream</h2>
            </div>
            {streams.map((stream) => (
              <div key={stream} style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stream} Stream
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
                  {streamClasses
                    .filter((c) => c.stream === stream)
                    .map((cls) => (
                      <Link
                        key={cls.id}
                        href={`/school/${school.slug}/${cls.class_slug}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div className="stitch-card stitch-card-hover" style={{
                          padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                        }}>
                          <span style={{ fontSize: '2rem' }}>📐</span>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif' }}>
                            {cls.class_name}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                            {stream}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            View Combo →
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </section>
        )}

      </div>
    </>
  );
}
