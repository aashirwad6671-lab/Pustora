'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface FlashDealsBannerProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  books: '📚',
  stationery: '✏️',
  toys: '🎁',
  art: '🎨',
};

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => (r <= 1000 ? targetMs : r - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  const totalSecs = Math.floor(remaining / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export default function FlashDealsBanner({ products, onAddToCart }: FlashDealsBannerProps) {
  // 4h 44m 52s countdown
  const { h, m, s } = useCountdown(4 * 3600 * 1000 + 44 * 60 * 1000 + 52 * 1000);

  const dealProducts = products.slice(0, 4);

  return (
    <section className="flash-banner" aria-label="Flash deals">
      {/* Top row: title + countdown */}
      <div className="flash-banner-top">
        <div className="flash-banner-left">
          <div className="flash-icon-wrap" aria-hidden="true">⚡</div>
          <div>
            <h2 className="flash-title">Flash Deals</h2>
            <p className="flash-sub">Get extra 15% off on selected items — limited time only</p>
          </div>
        </div>

        <div className="flash-timer-wrap">
          <span className="flash-timer-label">Ends in</span>
          <div className="flash-countdown" role="timer" aria-label={`${h} hours ${m} minutes ${s} seconds remaining`}>
            <div className="flash-count-block">
              <span className="flash-count-num">{h}</span>
              <span className="flash-count-unit">HRS</span>
            </div>
            <span className="flash-count-sep" aria-hidden="true">:</span>
            <div className="flash-count-block">
              <span className="flash-count-num">{m}</span>
              <span className="flash-count-unit">MIN</span>
            </div>
            <span className="flash-count-sep" aria-hidden="true">:</span>
            <div className="flash-count-block">
              <span className="flash-count-num">{s}</span>
              <span className="flash-count-unit">SEC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deal cards */}
      {dealProducts.length > 0 && (
        <div className="flash-deal-cards">
          {dealProducts.map((p) => {
            const discountedPrice = Math.floor(p.price * 0.85);
            return (
              <div key={p.id} className="flash-deal-card">
                <div>
                  <span className="flash-deal-emoji" aria-hidden="true">
                    {CATEGORY_EMOJI[p.category_id] || '🛍️'}
                  </span>
                  <p className="flash-deal-name">{p.name}</p>
                  <p className="flash-deal-brand">{p.brand}{p.grade_suitability ? ` • ${p.grade_suitability}` : ''}</p>
                </div>
                <div className="flash-deal-bottom">
                  <span className="flash-deal-price">₹{discountedPrice}</span>
                  <button
                    className="flash-deal-grab-btn"
                    onClick={() => onAddToCart(p)}
                    id={`flash-grab-${p.id}`}
                    aria-label={`Grab deal: ${p.name} for ₹${discountedPrice}`}
                  >
                    Grab Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
