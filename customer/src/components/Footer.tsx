'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AccordionSection {
  title: string;
  links: { label: string; href: string }[];
}

const FOOTER_SECTIONS: AccordionSection[] = [
  {
    title: 'Shop',
    links: [
      { label: 'NCERT Books', href: '/?cat=books' },
      { label: 'Stationery', href: '/?cat=stationery' },
      { label: 'Toys & Gifts', href: '/?cat=toys' },
      { label: 'Art & Craft', href: '/?cat=art' },
      { label: 'School Uniforms', href: '/' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Track Order', href: '/cart' },
      { label: 'Returns & Refunds', href: '/' },
      { label: 'Contact Us', href: '/' },
      { label: 'FAQ', href: '/' },
      { label: 'Delivery Zones', href: '/' },
    ],
  },
  {
    title: 'Pustora',
    links: [
      { label: 'About Us', href: '/' },
      { label: 'Careers', href: '/' },
      { label: 'Blog', href: '/' },
      { label: 'Press Kit', href: '/' },
      { label: 'Partner with Us', href: '/' },
    ],
  },
];

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (title: string) =>
    setOpenSection((prev) => (prev === title ? null : title));

  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        {/* ── DESKTOP: 4-column grid ── */}
        <div className="footer-main">
          {/* Column 1: Brand */}
          <div className="footer-brand-section">
            <span className="footer-col-brand-logo">PUSTORA</span>
            <p className="footer-tagline">
              Original NCERT textbooks, guides, stationery, and creative
              toys delivered in 1-2 days from Lucknow's active hubs.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, padding: '4px 10px',
                borderRadius: '6px', background: 'rgba(255,255,255,0.1)',
                color: 'var(--footer-text)', border: '1px solid var(--footer-border)'
              }}>
                📍 Lucknow
              </span>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, padding: '4px 10px',
                borderRadius: '6px', background: 'rgba(255,255,255,0.1)',
                color: 'var(--footer-text)', border: '1px solid var(--footer-border)'
              }}>
                ⚡ Standard Delivery
              </span>
            </div>
          </div>

          {/* Columns 2, 3, 4 — Desktop only */}
          {FOOTER_SECTIONS.map((sec) => (
            <div key={sec.title} className="footer-accordion-col">
              <span className="footer-col-title">{sec.title}</span>
              <ul className="footer-links">
                {sec.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="footer-link">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Column 4: Get the App */}
          <div>
            <span className="footer-col-title">Get the App</span>
            <div className="footer-app-badges">
              <a
                href="#"
                className="footer-app-badge"
                id="footer-play-store"
                aria-label="Get it on Google Play"
                rel="noopener noreferrer"
              >
                <span className="footer-app-badge-icon">🤖</span>
                <div className="footer-app-badge-text">
                  <span className="footer-app-badge-label">Get it on</span>
                  <span className="footer-app-badge-store">Google Play</span>
                </div>
              </a>
              <a
                href="#"
                className="footer-app-badge"
                id="footer-app-store"
                aria-label="Download on the App Store"
                rel="noopener noreferrer"
              >
                <span className="footer-app-badge-icon">🍎</span>
                <div className="footer-app-badge-text">
                  <span className="footer-app-badge-label">Download on the</span>
                  <span className="footer-app-badge-store">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* ── MOBILE: Accordion sections (overlaid via CSS) ── */}
        <div className="footer-mobile-only">
          {/* Brand always shown */}
          <div className="footer-brand-section-mobile" style={{ padding: '24px 0 20px', borderBottom: '1px solid var(--footer-border)' }}>
            <span className="footer-col-brand-logo">PUSTORA</span>
            <p className="footer-tagline" style={{ marginBottom: '12px' }}>
              Fast school essentials delivery across Lucknow.
            </p>
          </div>

          {/* Accordion sections */}
          {FOOTER_SECTIONS.map((sec) => (
            <div
              key={sec.title}
              className={`footer-accordion-col${openSection === sec.title ? ' open' : ''}`}
            >
              <div
                className="footer-accordion-header"
                onClick={() => toggle(sec.title)}
                role="button"
                tabIndex={0}
                aria-expanded={openSection === sec.title}
                onKeyDown={(e) => e.key === 'Enter' && toggle(sec.title)}
              >
                <span className="footer-col-title">{sec.title}</span>
                <span className="footer-accordion-chevron">
                  <ChevronDown />
                </span>
              </div>
              <div className="footer-accordion-body">
                <ul className="footer-links">
                  {sec.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="footer-link">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* App badges stacked */}
          <div className="footer-app-section-mobile">
            <span className="footer-col-title">Get the App</span>
            <div className="footer-app-badges">
              <a href="#" className="footer-app-badge" id="footer-play-store-mobile" aria-label="Google Play">
                <span className="footer-app-badge-icon">🤖</span>
                <div className="footer-app-badge-text">
                  <span className="footer-app-badge-label">Get it on</span>
                  <span className="footer-app-badge-store">Google Play</span>
                </div>
              </a>
              <a href="#" className="footer-app-badge" id="footer-app-store-mobile" aria-label="App Store">
                <span className="footer-app-badge-icon">🍎</span>
                <div className="footer-app-badge-text">
                  <span className="footer-app-badge-label">Download on the</span>
                  <span className="footer-app-badge-store">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {year} Pustora Quick-Commerce Delivery, Lucknow. Original CBSE/NCERT syllabus catalog partner.
          </p>
          <nav className="footer-bottom-links" aria-label="Footer legal links">
            <a href="#" className="footer-bottom-link">Privacy Policy</a>
            <a href="#" className="footer-bottom-link">Terms of Service</a>
            <a href="#" className="footer-bottom-link">Sitemap</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
