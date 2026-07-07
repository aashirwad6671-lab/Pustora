'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Category } from '../../../types';
import { ProductService } from '../../../services/productService';
import { useCartStore } from '../../../store/cartStore';
import { useLocationStore } from '../../../store/locationStore';
import Navbar from '../../../components/Navbar';

const CATALOG_SNAPSHOT: Product[] = [
  {
    id: 'tb-ncert-m6', category_id: 'books', sub_category: 'textbooks',
    name: 'Mathematics Class VI (NCERT)', brand: 'NCERT',
    description: 'Standard textbook for Class 6 mathematics published by NCERT.',
    price: 150, mrp: 150, stock_quantity: 45, grade_suitability: 'Class 6',
    subject_tag: 'Mathematics', image_url: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'tb-ncert-s10', category_id: 'books', sub_category: 'textbooks',
    name: 'Science Class X (NCERT)', brand: 'NCERT',
    description: 'Official science textbook for CBSE Class 10 published by NCERT.',
    price: 195, mrp: 195, stock_quantity: 30, grade_suitability: 'Class 10',
    subject_tag: 'Science', image_url: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'nb-classmate-s6', category_id: 'stationery', sub_category: 'notebooks',
    name: 'Classmate Notebook Pack of 6', brand: 'Classmate',
    description: 'Premium quality softcover single line notebooks, 172 pages.',
    price: 360, mrp: 390, stock_quantity: 25, grade_suitability: 'All Grades',
    subject_tag: 'General', image_url: 'linear-gradient(135deg, #F5A623 0%, #D97706 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'toy-lego-classic', category_id: 'toys', sub_category: 'building-blocks',
    name: 'LEGO Creative Bricks (484 Pcs)', brand: 'LEGO',
    description: 'Medium creative brick box featuring 35 colors. Endless builders fun.',
    price: 1599, mrp: 1799, stock_quantity: 12, grade_suitability: 'Age 4+',
    subject_tag: 'Creative', image_url: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

const getCategoryDetails = (id: string) => {
  switch (id.toLowerCase()) {
    case 'books':
      return { name: 'School Textbooks', emoji: '📚', desc: 'CBSE, ICSE, NCERT syllabus guides & notebooks', color: '#6C3FD6', bg: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)' };
    case 'stationery':
      return { name: 'Premium Stationery', emoji: '✏️', desc: 'Classmate notebooks, drawing sheets, boards & pencils', color: '#F5A623', bg: 'linear-gradient(135deg, #F5A623 0%, #D97706 100%)' };
    case 'toys':
      return { name: 'Educational Toys', emoji: '🎁', desc: 'Building blocks, science experiment kits, board games', color: '#10B981', bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' };
    default:
      return { name: 'School Essentials', emoji: '✨', desc: 'Top-quality selected items delivered in 10 minutes', color: '#6C3FD6', bg: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)' };
  }
};

const CATEGORY_EMOJI: Record<string, string> = {
  books: '📚', stationery: '✏️', toys: '🎁', art: '🎨',
};

const GRADE_OPTIONS = ['all', 'Class 6', 'Class 10', 'Age 4+', 'All Grades'];

export default function CategoryProductsPage({ params }: { params: { id: string } }) {
  const { addItem } = useCartStore();
  const { availableStores, nearestStore, fetchStores } = useLocationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'default'>('default');
  const [selectedStoreId, setSelectedStoreId] = useState('');

  const catDetails = getCategoryDetails(params.id);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (availableStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(availableStores[0].id);
    }
  }, [availableStores]);

  useEffect(() => {
    loadCatalog();
  }, [params.id, gradeFilter, searchQuery, sortBy]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const filters: any = { categoryId: params.id };
      if (gradeFilter !== 'all') filters.gradeSuitability = gradeFilter;
      if (searchQuery) filters.searchQuery = searchQuery;

      const response = await ProductService.getProducts(filters);
      let list: Product[] = [];
      if (response.data && response.data.length > 0) {
        list = response.data;
      } else {
        let filtered = CATALOG_SNAPSHOT.filter((p) => p.category_id === params.id);
        if (gradeFilter !== 'all') {
          filtered = filtered.filter((p) => p.grade_suitability?.toLowerCase().includes(gradeFilter.toLowerCase()));
        }
        if (searchQuery) {
          filtered = filtered.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        list = filtered;
      }
      if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
      else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
      setProducts(list);
    } catch {
      setProducts(CATALOG_SNAPSHOT.filter((p) => p.category_id === params.id));
    } finally {
      setLoading(false);
    }
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStoreId(e.target.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Shared Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStoreId={selectedStoreId}
        onStoreChange={handleStoreChange}
        availableStores={availableStores}
      />

      <main className="main-content" id="main-content">
        <div className="page-container" style={{ paddingTop: '28px', paddingBottom: '56px' }}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '20px' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
              <li><Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</Link></li>
              <li aria-hidden="true">›</li>
              <li aria-current="page" style={{ color: 'var(--deep-text)' }}>{catDetails.name}</li>
            </ol>
          </nav>

          {/* Category Header Banner */}
          <section
            style={{
              borderRadius: '20px',
              padding: '32px 36px',
              marginBottom: '32px',
              background: catDetails.bg,
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
            aria-label={`${catDetails.name} category`}
          >
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px',
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
            }} />
            <div style={{
              width: '72px', height: '72px', borderRadius: '18px',
              background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', flexShrink: 0,
            }}>
              {catDetails.emoji}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#fff', marginBottom: '6px' }}>
                {catDetails.name}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>{catDetails.desc}</p>
            </div>
          </section>

          {/* Filter Toolbar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: '12px', marginBottom: '24px',
            padding: '16px 20px', background: 'var(--surface)',
            borderRadius: '14px', border: '1px solid var(--outline)',
          }}>
            {/* Grade chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(g)}
                  className={`cat-chip${gradeFilter === g ? ' active' : ''}`}
                  style={{ minHeight: '38px', padding: '0 14px', fontSize: '0.8125rem' }}
                  id={`grade-chip-${g.replace(/\s/g, '-')}`}
                  aria-pressed={gradeFilter === g}
                >
                  {g === 'all' ? 'All Classes' : g}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="navbar-location-select"
                style={{
                  background: 'var(--tint-chip)', border: '1px solid var(--outline)',
                  borderRadius: '8px', padding: '8px 12px', minHeight: '38px',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.8125rem',
                  color: 'var(--deep-text)', cursor: 'pointer',
                }}
                aria-label="Sort products"
              >
                <option value="default">Relevance</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {/* Product count */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
              {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="product-grid product-grid-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card" aria-hidden="true">
                  <div className="skel-img stitch-skeleton" />
                  <div className="skel-body">
                    <div className="stitch-skeleton" style={{ height: '10px', width: '40%' }} />
                    <div className="stitch-skeleton" style={{ height: '14px', width: '80%' }} />
                    <div className="stitch-skeleton" style={{ height: '12px', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 24px', gap: '12px',
              background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--outline)',
            }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <p style={{ fontWeight: 700, color: 'var(--deep-text)' }}>No products found</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                Try a different grade filter or{' '}
                <Link href="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>browse all</Link>
              </p>
            </div>
          ) : (
            <div className="product-grid product-grid-3">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="product-card"
                  id={`product-card-cat-${p.id}`}
                  aria-label={p.name}
                >
                  <Link href={`/product/${p.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                    <div className="product-card-img-area">
                      <div
                        className="product-card-img-bg"
                        style={{ background: p.image_url || 'var(--primary-gradient)', opacity: 0.2 }}
                      />
                      <span className="product-card-emoji">
                        {CATEGORY_EMOJI[p.category_id] || '🛍️'}
                      </span>
                      {p.is_bestseller && (
                        <span className="product-card-bestseller">⚡ Bestseller</span>
                      )}
                    </div>
                  </Link>

                  <div className="product-card-body">
                    <span className="product-card-cat">
                      {p.brand} {p.grade_suitability ? `· ${p.grade_suitability}` : ''}
                    </span>
                    <Link href={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                      <h2 className="product-card-name">{p.name}</h2>
                    </Link>
                    {p.description && (
                      <p className="product-card-meta" style={{ marginTop: '4px' }}>
                        {p.description.slice(0, 72)}{p.description.length > 72 ? '…' : ''}
                      </p>
                    )}
                  </div>

                  <div className="product-card-footer">
                    <div>
                      <span className="product-price-main">₹{p.price}</span>
                      {p.mrp > p.price && <span className="product-price-mrp">₹{p.mrp}</span>}
                    </div>
                    <button
                      onClick={() => addItem(p, 1)}
                      className="product-add-btn"
                      id={`btn-add-cat-${p.id}`}
                      aria-label={`Add ${p.name} to cart`}
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
      </main>
    </div>
  );
}
