'use client';

import React from 'react';
import Link from 'next/link';

const TRUST = [
  { icon: '⚡', label: '10–15 Mins', sub: 'Express Delivery' },
  { icon: '🛒', label: '5000+ Items', sub: 'Wholesale Prices' },
  { icon: '💯', label: '100% Quality', sub: 'Fresh & Verified' },
];

export default function HeroSection() {
  return (
    <section className="hero-v2" aria-label="Hero">
      {/* Decorative background blobs */}
      <div className="hero-v2-blob hero-v2-blob-white" aria-hidden="true" />
      <div className="hero-v2-blob hero-v2-blob-amber" aria-hidden="true" />

      <div className="hero-v2-inner">
        {/* ── Tag badge ── */}
        <div className="hero-v2-eyebrow">
          <span>⚡</span> Express Delivery in 10-15 Mins
        </div>

        {/* ── Headline ── */}
        <h1 className="hero-v2-headline">
          Ghar ka rashan ho ya snacks —{' '}
          <span className="hero-v2-accent">sab milega</span>{' '}
          chutkiyon mein!
        </h1>

        {/* ── Subtext ── */}
        <p className="hero-v2-sub">
          Atta, Dal, Cooking Oil, Fresh Dairy, Instant Munchies &amp; Household Essentials —
          dispatched straight to your kitchen in 10–15 minutes.
        </p>

        {/* ── CTAs ── */}
        <div className="hero-v2-ctas">
          <Link href="#products-section" className="hero-v2-btn-solid" id="hero-cta-shop">
            Order Groceries Now →
          </Link>
          <Link href="/cart" className="hero-v2-btn-ghost" id="hero-cta-track">
            View Cart
          </Link>
        </div>

        {/* ── Trust strip (3 chips) ── */}
        <div className="hero-v2-trust">
          {TRUST.map((t) => (
            <div key={t.label} className="hero-v2-trust-chip">
              <span className="hero-v2-trust-icon">{t.icon}</span>
              <span className="hero-v2-trust-label">{t.label}</span>
              <span className="hero-v2-trust-sub">{t.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
