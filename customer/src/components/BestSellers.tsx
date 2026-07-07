'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '../types';

interface BestSellersProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
}

const CAT_PASTEL: Record<string, { bg: string; emoji: string }> = {
  books:      { bg: '#E6F1FB', emoji: '📚' },
  stationery: { bg: '#FAEEDA', emoji: '✏️' },
  toys:       { bg: '#FBEAF0', emoji: '🧸' },
  gifts:      { bg: '#EAF3DE', emoji: '🎁' },
  art:        { bg: '#EEEDFE', emoji: '🎨' },
};

export default function BestSellers({ products, onAddToCart }: BestSellersProps) {
  if (!products || products.length === 0) return null;

  const featured = products.slice(0, 6);

  return (
    <section aria-labelledby="bestsellers-heading">
      <div className="section-header">
        <h2 className="section-title" id="bestsellers-heading">
          🔥 Best Sellers
        </h2>
        <Link href="/category/books" className="section-link" id="bestsellers-see-all">
          See all →
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
              <Link href={`/product/${p.id}`} className="bs-card-img" style={{ background: cat.bg }} tabIndex={-1} aria-hidden="true">
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
                <Link href={`/product/${p.id}`} className="bs-card-name">
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
