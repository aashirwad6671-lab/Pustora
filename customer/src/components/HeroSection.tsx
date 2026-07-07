'use client';

import React from 'react';
import Link from 'next/link';

const TRUST = [
  { icon: '🚚', label: 'Free Delivery', sub: 'On every order' },
  { icon: '💳', label: 'Cash on\nDelivery', sub: 'Always available' },
  { icon: '⚡', label: 'Standard\nDelivery', sub: 'In 1-2 Days' },
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
          <span>⚡</span> Active in Lucknow
        </div>

        {/* ── Headline ── */}
        <h1 className="hero-v2-headline">
          Padhna ho ya khelna —{' '}
          <span className="hero-v2-accent">sab kuch</span>{' '}
          aapke ghar tak
        </h1>

        {/* ── Subtext ── */}
        <p className="hero-v2-sub">
          NCERT books, notebooks, stationery &amp; creative toys — delivered
          from Hazratganj, Gomti Nagar &amp; Aliganj hubs in 1-2 days.
        </p>

        {/* ── CTAs ── */}
        <div className="hero-v2-ctas">
          <Link href="/" className="hero-v2-btn-solid" id="hero-cta-shop">
            Shop now →
          </Link>
          <Link href="/cart" className="hero-v2-btn-ghost" id="hero-cta-track">
            Track order
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
