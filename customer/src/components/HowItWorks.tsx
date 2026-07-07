'use client';

import React from 'react';

const STEPS = [
  {
    num: '1',
    numBg: 'var(--primary-gradient)',
    title: 'Search & Discover',
    desc: 'Find books, stationery, or toys by class, subject, or brand.',
    icon: '🔍',
  },
  {
    num: '2',
    numBg: 'linear-gradient(135deg, #F5A623 0%, #F97316 100%)',
    title: 'Place Your Order',
    desc: 'Checkout in seconds — UPI, card, or Cash on Delivery.',
    icon: '🛒',
  },
  {
    num: '3',
    numBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    title: 'Delivered in 1-2 Days',
    desc: 'Our delivery partners reach your door securely and quickly.',
    icon: '⚡',
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading">
      <h2 className="section-title" id="how-heading" style={{ marginBottom: '14px' }}>
        How Pustora Works
      </h2>
      <div className="how-v2-steps">
        {STEPS.map((s) => (
          <div key={s.num} className="how-v2-card" id={`how-step-${s.num}`}>
            {/* Colored number badge */}
            <div
              className="how-v2-num"
              style={{ background: s.numBg }}
              aria-hidden="true"
            >
              {s.num}
            </div>

            {/* Content */}
            <div className="how-v2-body">
              <div className="how-v2-title">
                <span aria-hidden="true">{s.icon}</span> {s.title}
              </div>
              <p className="how-v2-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
