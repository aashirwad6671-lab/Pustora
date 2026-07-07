'use client';

import React from 'react';

export default function AppBanner() {
  return (
    <section className="app-banner" aria-labelledby="app-banner-heading">
      {/* Background orbs */}
      <div className="app-banner-orb app-banner-orb-1" aria-hidden="true" />
      <div className="app-banner-orb app-banner-orb-2" aria-hidden="true" />

      <div className="app-banner-inner">
        {/* Left text */}
        <div className="app-banner-text">
          <div className="app-banner-eyebrow">📱 Coming to Your Phone</div>
          <h2 className="app-banner-title" id="app-banner-heading">
            Get the Pustora App
          </h2>
          <p className="app-banner-subtitle">
            Track orders live, get push notifications for flash deals, and
            reorder school essentials with one tap. Available on Android &amp; iOS.
          </p>

          <div className="app-banner-badges">
            <a
              href="#"
              className="app-store-badge"
              id="app-banner-google-play"
              aria-label="Get it on Google Play"
              rel="noopener noreferrer"
            >
              <span className="app-store-badge-icon">🤖</span>
              <div className="app-store-badge-text">
                <span className="app-store-label">Get it on</span>
                <span className="app-store-name">Google Play</span>
              </div>
            </a>
            <a
              href="#"
              className="app-store-badge"
              id="app-banner-app-store"
              aria-label="Download on the App Store"
              rel="noopener noreferrer"
            >
              <span className="app-store-badge-icon">🍎</span>
              <div className="app-store-badge-text">
                <span className="app-store-label">Download on the</span>
                <span className="app-store-name">App Store</span>
              </div>
            </a>
          </div>
        </div>

        {/* Right: phone mock / stats */}
        <div className="app-banner-visual" aria-hidden="true">
          <div className="app-phone-card">
            <div className="app-phone-header">
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>
                PUSTORA
              </span>
            </div>
            <div className="app-phone-body">
              <div className="app-phone-stat">
                <span className="app-phone-stat-num">48</span>
                <span className="app-phone-stat-label">Hr delivery</span>
              </div>
              <div className="app-phone-divider" />
              <div className="app-phone-stat">
                <span className="app-phone-stat-num">4.8★</span>
                <span className="app-phone-stat-label">App rating</span>
              </div>
              <div className="app-phone-divider" />
              <div className="app-phone-stat">
                <span className="app-phone-stat-num">2.4k+</span>
                <span className="app-phone-stat-label">Happy users</span>
              </div>
            </div>
            <div className="app-phone-order">
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>
                📦 Live Order
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                NCERT Science Class X
              </span>
              <div className="app-phone-progress">
                <div className="app-phone-progress-fill" />
              </div>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>
                Arriving tomorrow · Gomti Nagar Hub
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
