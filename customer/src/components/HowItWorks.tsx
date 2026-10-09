'use client';

import React from 'react';

const STEPS = [
  {
    num: '1',
    numBg: 'var(--primary-gradient)',
    title: 'Choose Essentials',
    desc: 'Browse fresh milk, atta, oil, snacks, cold drinks & daily items.',
    icon: '🛒',
  },
  {
    num: '2',
    numBg: 'linear-gradient(135deg, #F5A623 0%, #F97316 100%)',
    title: 'Instant 1-Click Order',
    desc: 'Pay securely via UPI, Card, or choose Cash on Delivery.',
    icon: '⚡',
  },
  {
    num: '3',
    numBg: 'linear-gradient(135deg, #0C831F 0%, #15A029 100%)',
    title: 'Doorstep in 10-15 Mins',
    desc: 'Our local dark store rider brings fresh groceries to your kitchen.',
    icon: '🛵',
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading">
      <h2 className="section-title" id="how-heading" style={{ marginBottom: '14px' }}>
        How XYZ Grocery Works
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
