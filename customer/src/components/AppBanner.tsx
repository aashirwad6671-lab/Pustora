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
              <svg className="app-store-badge-svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M3.18 23.76c.3.17.64.24.98.21L14.89 12 3.18 0.03A1.5 1.5 0 002.5 1.5v21c0 .5.26.96.68 1.26z" fill="#EA4335"/>
                <path d="M19.09 9.37l-2.66-1.53-3.19 3.16 3.19 3.16 2.69-1.55a1.5 1.5 0 000-3.24z" fill="#FBBC04"/>
                <path d="M3.18 0.03l11.71 11.97 3.54-3.51-11.6-6.69A1.5 1.5 0 003.18.03z" fill="#4285F4"/>
                <path d="M3.18 23.97a1.5 1.5 0 002.65.19l11.6-6.69-3.54-3.51L3.18 23.97z" fill="#34A853"/>
              </svg>
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
              <svg className="app-store-badge-svg-icon" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
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
