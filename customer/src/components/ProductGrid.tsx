'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
}

const GRADE_OPTIONS = ['Class 1–2', 'Class 3–5', 'Class 6–8', 'Class 9–10', 'Class 11–12'];
const BRAND_OPTIONS = ['NCERT', 'Classmate', 'Camel', 'LEGO', 'Maped'];
const SUBJECT_OPTIONS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

const CATEGORY_EMOJI: Record<string, string> = {
  books: '📚',
  stationery: '✏️',
  toys: '🎁',
  art: '🎨',
};

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skel-img stitch-skeleton" />
      <div className="skel-body">
        <div className="stitch-skeleton skel-line" style={{ height: '10px', width: '40%' }} />
        <div className="stitch-skeleton skel-line" style={{ height: '14px', width: '80%' }} />
        <div className="stitch-skeleton skel-line" style={{ height: '12px', width: '60%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div className="stitch-skeleton skel-line" style={{ height: '20px', width: '30%' }} />
          <div className="stitch-skeleton skel-line" style={{ height: '32px', width: '36%', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, onAddToCart }: ProductGridProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceMax, setPriceMax] = useState(2000);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close filter on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setFilterOpen(false);
  };

  // Lock body scroll when filter open on mobile
  useEffect(() => {
    if (filterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [filterOpen]);

  const toggleGrade = (g: string) =>
    setSelectedGrades((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  const clearFilters = () => {
    setPriceMax(2000);
    setSelectedGrades([]);
    setSelectedBrands([]);
  };

  const activeFilterCount = selectedGrades.length + selectedBrands.length + (priceMax < 2000 ? 1 : 0);

  const FilterContent = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--deep-text)' }}>
          Filters
        </span>
        {activeFilterCount > 0 && (
          <button className="filter-clear-all" onClick={clearFilters}>Clear all</button>
        )}
      </div>

      <div className="filter-divider" />

      {/* Price */}
      <div className="filter-group">
        <p className="filter-group-title">Price Range</p>
        <div className="filter-price-row">
          <span>₹0</span>
          <span>Up to ₹{priceMax.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="price-range-input"
          aria-label="Maximum price"
        />
      </div>

      <div className="filter-divider" />

      {/* Class/Grade */}
      <div className="filter-group">
        <p className="filter-group-title">Class / Grade</p>
        {GRADE_OPTIONS.map((g) => (
          <label key={g} className="filter-option">
            <input
              type="checkbox"
              checked={selectedGrades.includes(g)}
              onChange={() => toggleGrade(g)}
              aria-label={`Filter by ${g}`}
            />
            {g}
          </label>
        ))}
      </div>

      <div className="filter-divider" />

      {/* Brand */}
      <div className="filter-group">
        <p className="filter-group-title">Brand</p>
        {BRAND_OPTIONS.map((b) => (
          <label key={b} className="filter-option">
            <input
              type="checkbox"
              checked={selectedBrands.includes(b)}
              onChange={() => toggleBrand(b)}
              aria-label={`Filter by ${b}`}
            />
            {b}
          </label>
        ))}
      </div>

      <div className="filter-divider" />

      {/* Subject */}
      <div className="filter-group">
        <p className="filter-group-title">Subject</p>
        {SUBJECT_OPTIONS.map((s) => (
          <label key={s} className="filter-option">
            <input type="checkbox" aria-label={`Filter by ${s}`} />
            {s}
          </label>
        ))}
      </div>
    </>
  );

  return (
    <section aria-label="Product catalog">
      {/* Section header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">✨ Bestselling Products</h2>
          <p className="section-subtitle">Lucknow student essentials delivered in minutes</p>
        </div>
        <span className="section-badge">{products.length} Products</span>
      </div>

      {/* Mobile / Tablet filter trigger bar */}
      <div className="filter-topbar" aria-label="Filter controls">
        <button
          className="filter-trigger-btn"
          onClick={() => setFilterOpen(true)}
          id="filter-open-btn"
          aria-expanded={filterOpen}
          aria-controls="filter-panel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-active-count">{activeFilterCount}</span>
          )}
        </button>
        <span className="product-count-badge">{products.length} results</span>
      </div>

      {/* Browse layout: sidebar + grid */}
      <div className="browse-layout">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="filter-sidebar" aria-label="Filter panel">
          <FilterContent />
        </aside>

        {/* ── PRODUCT GRID ── */}
        <div>
          {loading ? (
            <div className="product-grid product-grid-4" role="status" aria-label="Loading products">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 24px', gap: '12px',
              background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)'
            }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <p style={{ fontWeight: 700, color: 'var(--deep-text)' }}>No products found</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Try a different search or category</p>
            </div>
          ) : (
            <div className="product-grid product-grid-4">
              {products.map((prod) => (
                <article
                  key={prod.id}
                  className="product-card"
                  id={`product-card-${prod.id}`}
                  aria-label={prod.name}
                >
                  {/* Image area */}
                  <Link href={`/product/${prod.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                    <div className="product-card-img-area">
                      <div
                        className="product-card-img-bg"
                        style={{ background: prod.image_url || 'var(--primary-gradient)' }}
                      />
                      <span className="product-card-emoji">
                        {CATEGORY_EMOJI[prod.category_id] || '🛍️'}
                      </span>
                      {prod.is_bestseller && (
                        <span className="product-card-bestseller">⚡ Bestseller</span>
                      )}
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="product-card-body">
                    <span className="product-card-cat">
                      {prod.category_id} {prod.grade_suitability ? `• ${prod.grade_suitability}` : ''}
                    </span>
                    <Link href={`/product/${prod.id}`} style={{ textDecoration: 'none' }}>
                      <h3 className="product-card-name">{prod.name}</h3>
                    </Link>
                    <p className="product-card-meta">{prod.brand}</p>
                  </div>

                  {/* Footer */}
                  <div className="product-card-footer">
                    <div>
                      <span className="product-price-main">₹{prod.price}</span>
                      {prod.mrp > prod.price && (
                        <span className="product-price-mrp">₹{prod.mrp}</span>
                      )}
                    </div>
                    <button
                      onClick={() => onAddToCart(prod)}
                      className="product-add-btn"
                      id={`add-to-cart-${prod.id}`}
                      aria-label={`Add ${prod.name} to cart`}
                    >
                      Add
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FILTER OVERLAY ── */}
      <div
        ref={overlayRef}
        className={`filter-overlay${filterOpen ? ' open' : ''}`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* ── TABLET: RIGHT DRAWER ── */}
      <div
        className={`filter-drawer${filterOpen ? ' open' : ''}`}
        id="filter-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className="filter-panel-header">
          <span className="filter-panel-title">Filters</span>
          <button className="filter-close-btn" onClick={() => setFilterOpen(false)} aria-label="Close filters">
            ✕
          </button>
        </div>
        <FilterContent />
        <button
          className="stitch-btn"
          style={{ width: '100%', marginTop: 'auto', justifyContent: 'center' }}
          onClick={() => setFilterOpen(false)}
        >
          Show {products.length} Results
        </button>
      </div>

      {/* ── MOBILE: BOTTOM SHEET ── */}
      <div
        className={`filter-bottom-sheet${filterOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className="sheet-handle" />
        <div className="filter-panel-header">
          <span className="filter-panel-title">Filters</span>
          <button className="filter-close-btn" onClick={() => setFilterOpen(false)} aria-label="Close filters">
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FilterContent />
        </div>
        <button
          className="stitch-btn"
          style={{ width: '100%', justifyContent: 'center', marginTop: '12px', flexShrink: 0 }}
          onClick={() => setFilterOpen(false)}
        >
          Show {products.length} Results
        </button>
      </div>
    </section>
  );
}
