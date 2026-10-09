'use client';

import React, { useState, useEffect, useRef } from 'react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'Resident · Hazratganj',
    avatar: 'PS',
    avatarColor: 'linear-gradient(135deg, #0C831F 0%, #15A029 100%)',
    stars: 5,
    text: 'Ordered milk, bread and eggs in the morning and the rider reached my doorstep in just 11 minutes! Everything was fresh and chilled.',
  },
  {
    id: 2,
    name: 'Rahul Verma',
    role: 'Customer · Gomti Nagar',
    avatar: 'RV',
    avatarColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    stars: 5,
    text: 'Needed cold drinks, Lay’s chips and Maggi for movie night with friends. Delivered in 12 minutes flat. XYZ Grocery is a lifesaver!',
  },
  {
    id: 3,
    name: 'Mrs. Anjali Gupta',
    role: 'Home Maker · Aliganj',
    avatar: 'AG',
    avatarColor: 'linear-gradient(135deg, #F5A623 0%, #D97706 100%)',
    stars: 5,
    text: 'I buy all monthly grocery staples — Aashirvaad atta, Fortune oil and Tata dal here. Prices are lower than local supermarkets and delivery is instant.',
  },
  {
    id: 4,
    name: 'Amit Kumar',
    role: 'Customer · Indira Nagar',
    avatar: 'AK',
    avatarColor: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    stars: 5,
    text: 'Super smooth experience. Fresh Amul butter, paneer and tea arrived packed safely with ice gel pack. Cash on Delivery worked seamlessly.',
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
  };

  useEffect(() => {
    if (!isPaused) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused]);

  const goTo = (idx: number) => {
    setActive(idx);
    startTimer();
  };

  const t = TESTIMONIALS[active];

  return (
    <section className="testimonials-section" aria-labelledby="testimonials-heading">
      <div className="section-header">
        <div>
          <h2 className="section-title" id="testimonials-heading">💬 What Our Customers Say</h2>
          <p className="section-subtitle">Real reviews from Lucknow families and students</p>
        </div>
        <span className="section-badge">4.8★ · 2,400+ reviews</span>
      </div>

      <div
        className="testimonials-carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-live="polite"
        aria-label="Customer testimonials carousel"
      >
        {/* Cards row — translate based on active */}
        <div className="testimonials-track-wrap">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={item.id}
              className={`testimonial-card${idx === active ? ' testimonial-card-active' : ''}`}
              aria-hidden={idx !== active}
              id={`testimonial-${item.id}`}
            >
              {/* Stars */}
              <div className="testimonial-stars" aria-label={`${item.stars} out of 5 stars`}>
                {Array.from({ length: item.stars }).map((_, i) => (
                  <span key={i} aria-hidden="true">★</span>
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="testimonial-text">"{item.text}"</blockquote>

              {/* Author */}
              <div className="testimonial-author">
                <div
                  className="testimonial-avatar"
                  style={{ background: item.avatarColor }}
                  aria-hidden="true"
                >
                  {item.avatar}
                </div>
                <div>
                  <div className="testimonial-name">{item.name}</div>
                  <div className="testimonial-role">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="testimonials-dots" role="tablist" aria-label="Review navigation">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === active}
              aria-label={`Review ${idx + 1}`}
              onClick={() => goTo(idx)}
              className={`testimonials-dot${idx === active ? ' testimonials-dot-active' : ''}`}
              id={`testimonial-dot-${idx}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
