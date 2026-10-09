'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '../types';

interface BestSellersProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
}

const CAT_PASTEL: Record<string, { bg: string; emoji: string }> = {
  'atta-rice-dal':        { bg: '#FEF8E7', emoji: '🌾' },
  'oil-ghee-masala':      { bg: '#FFF4E5', emoji: '🫒' },
  'dairy-bread-eggs':     { bg: '#EBF4FF', emoji: '🥛' },
  'instant-frozen':       { bg: '#FFF1F2', emoji: '🍜' },
  'chocolates-sweets':    { bg: '#FDF2F8', emoji: '🍫' },
  'bakery-biscuits':      { bg: '#FFF7ED', emoji: '🍪' },
  'drinks-juices':        { bg: '#F0FDF4', emoji: '🥤' },
  'chips-namkeen':        { bg: '#FEFCE8', emoji: '🥨' },
  'cleaning-essentials':  { bg: '#F0FDFA', emoji: '🧼' },
  'tea-coffee':           { bg: '#FAF5FF', emoji: '☕' },
};

export default function BestSellers({ products, onAddToCart }: BestSellersProps) {
  if (!products || products.length === 0) return null;

  const featured = products.slice(0, 8);

  return (
    <section aria-labelledby="bestsellers-heading">
      <div className="section-header">
        <h2 className="section-title" id="bestsellers-heading">
          🔥 Trending in Lucknow
        </h2>
        <Link href="/category/all" className="section-link" id="bestsellers-see-all">
          See all items →
        </Link>
      </div>

      {/* Horizontal scroll row on mobile, grid on desktop */}
      <div className="bestsellers-row">
        {featured.map((p) => {
          const cat = CAT_PASTEL[p.category_id] || { bg: '#EDE8FF', emoji: '🛍️' };
          const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

          return (
            <article
              key={p.id}
              className="bs-card"
              id={`bs-card-${p.id}`}
              aria-label={p.name}
            >
              {/* Image area */}
              <Link href={`/product/${(p as any).slug || p.id}`} className="bs-card-img" style={{ background: cat.bg }} tabIndex={-1} aria-hidden="true">
                <span className="bs-card-emoji" role="img" aria-label={p.category_id}>
                  {cat.emoji}
                </span>
                {discount > 0 && (
                  <span className="bs-card-discount" aria-label={`${discount}% off`}>
                    -{discount}%
                  </span>
                )}
              </Link>

              {/* Body */}
              <div className="bs-card-body">
                <span className="bs-card-brand">{p.brand}</span>
                <Link href={`/product/${(p as any).slug || p.id}`} className="bs-card-name">
                  {p.name}
                </Link>
                <div className="bs-card-footer">
                  <div className="bs-card-prices">
                    <span className="bs-card-price">₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span className="bs-card-mrp">₹{p.mrp}</span>
                    )}
                  </div>
                  <button
                    onClick={() => onAddToCart(p)}
                    className="bs-card-add"
                    id={`bs-add-${p.id}`}
                    aria-label={`Add ${p.name} to cart`}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
