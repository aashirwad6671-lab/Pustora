// /school/page.tsx
// School directory — lists all available schools
// URL: /school
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '../../components/JsonLd';
import { getAllSchools } from '../../services/schoolService';

export const metadata: Metadata = {
  title: 'School Books & Combos in Lucknow — All Schools | Pustora',
  description:
    'Find complete book sets and class-wise combos for all major Lucknow schools — CMS, La Martiniere, DPS, Jaipuria, Loreto, and more. Fast delivery in Lucknow.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in'}/school`,
  },
};

export default async function SchoolDirectoryPage() {
  const schools = await getAllSchools().catch(() => []);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pustora.in';

  const featured = schools.filter((s) => s.is_featured);
  const others = schools.filter((s) => !s.is_featured);

  return (
    <>
      <JsonLd
        type="BreadcrumbList"
        data={[
          { name: 'Home', url: siteUrl },
          { name: 'Schools', url: `${siteUrl}/school` },
        ]}
      />

      <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', display: 'flex', gap: '6px' }}>
          <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Home</Link>
          <span>›</span>
          <span style={{ color: 'var(--deep-text)', fontWeight: 700 }}>Schools</span>
        </nav>

        {/* ── Header ── */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: 'clamp(1.375rem, 4vw, 2rem)', fontFamily: 'Sora, sans-serif', marginBottom: '8px' }}>
            🏫 Shop By School
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem' }}>
            Select your school to see class-wise book combos, stationery kits, and more — delivered in Lucknow.
          </p>
        </div>

        {/* ── Empty state ── */}
        {schools.length === 0 && (
          <div className="stitch-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏫</div>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Schools Coming Soon</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
              We are adding Lucknow school combos. Check back soon!
            </p>
          </div>
        )}

        {/* ── Featured Schools ── */}
        {featured.length > 0 && (
          <section aria-label="Featured schools" style={{ marginBottom: '40px' }}>
            <h2 className="section-title" style={{ marginBottom: '20px' }}>⭐ Popular Schools</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {featured.map((school) => (
                <Link key={school.id} href={`/school/${school.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="stitch-card stitch-card-hover" style={{
                    padding: '1.75rem 1.25rem', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '12px', textAlign: 'center', cursor: 'pointer',
                    borderTop: '3px solid var(--primary)',
                  }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '14px',
                      background: 'var(--primary-gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.75rem',
                    }}>🏫</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif' }}>
                        {school.short_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                        {school.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--tint-chip)', color: 'var(--primary)' }}>
                        {school.board}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                      View Combos →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── All Other Schools ── */}
        {others.length > 0 && (
          <section aria-label="All schools">
            <h2 className="section-title" style={{ marginBottom: '20px' }}>All Schools</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {others.map((school) => (
                <Link key={school.id} href={`/school/${school.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="stitch-card stitch-card-hover" style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '1rem 1.25rem', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: 'var(--tint-chip)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                    }}>🏫</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--deep-text)' }}>
                        {school.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                        {school.board} · {school.city}
                      </div>
                    </div>
                    <span style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>›</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </>
  );
}
