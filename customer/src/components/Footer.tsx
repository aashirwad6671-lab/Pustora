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
      { label: 'Track Order', href: '/orders' },
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
                <svg className="footer-app-badge-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.18 23.76c.3.17.64.24.98.21L14.89 12 3.18 0.03A1.5 1.5 0 002.5 1.5v21c0 .5.26.96.68 1.26z" fill="#EA4335"/>
                  <path d="M19.09 9.37l-2.66-1.53-3.19 3.16 3.19 3.16 2.69-1.55a1.5 1.5 0 000-3.24z" fill="#FBBC04"/>
                  <path d="M3.18 0.03l11.71 11.97 3.54-3.51-11.6-6.69A1.5 1.5 0 003.18.03z" fill="#4285F4"/>
                  <path d="M3.18 23.97a1.5 1.5 0 002.65.19l11.6-6.69-3.54-3.51L3.18 23.97z" fill="#34A853"/>
                </svg>
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
                <svg className="footer-app-badge-icon-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="footer-app-badge-text">
                  <span className="footer-app-badge-label">Download on the</span>
                  <span className="footer-app-badge-store">App Store</span>
                </div>
              </a>
            </div>
            {/* Social Media */}
            <div className="footer-social" style={{ marginTop: '20px' }}>
              <span className="footer-col-title" style={{ fontSize: '0.75rem', marginBottom: '10px', display: 'block' }}>Follow Us</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://instagram.com/pustora" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://twitter.com/pustora" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Twitter/X">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
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
                <svg className="footer-app-badge-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.18 23.76c.3.17.64.24.98.21L14.89 12 3.18 0.03A1.5 1.5 0 002.5 1.5v21c0 .5.26.96.68 1.26z" fill="#EA4335"/>
                  <path d="M19.09 9.37l-2.66-1.53-3.19 3.16 3.19 3.16 2.69-1.55a1.5 1.5 0 000-3.24z" fill="#FBBC04"/>
                  <path d="M3.18 0.03l11.71 11.97 3.54-3.51-11.6-6.69A1.5 1.5 0 003.18.03z" fill="#4285F4"/>
                  <path d="M3.18 23.97a1.5 1.5 0 002.65.19l11.6-6.69-3.54-3.51L3.18 23.97z" fill="#34A853"/>
                </svg>
                <div className="footer-app-badge-text">
                  <span className="footer-app-badge-label">Get it on</span>
                  <span className="footer-app-badge-store">Google Play</span>
                </div>
              </a>
              <a href="#" className="footer-app-badge" id="footer-app-store-mobile" aria-label="App Store">
                <svg className="footer-app-badge-icon-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="footer-app-badge-text">
                  <span className="footer-app-badge-label">Download on the</span>
                  <span className="footer-app-badge-store">App Store</span>
                </div>
              </a>
            </div>
            {/* Social mobile */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <a href="https://instagram.com/pustora" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://twitter.com/pustora" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Twitter/X">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
