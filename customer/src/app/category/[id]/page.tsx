'use client';

export const runtime = 'edge';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Category } from '../../../types';
import { ProductService } from '../../../services/productService';
import { useCartStore } from '../../../store/cartStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import { useLocationStore } from '../../../store/locationStore';
import Navbar from '../../../components/Navbar';
import CartBar from '../../../components/CartBar';

const CATALOG_SNAPSHOT: Product[] = [
  // 🌾 Atta, Rice & Dal
  {
    id: 'atta-aashirvaad-5kg', category_id: 'atta-rice-dal', sub_category: 'flours',
    name: 'Aashirvaad Shudh Chakki Atta', brand: 'Aashirvaad', unit: '5 kg',
    description: '100% whole wheat flour with natural dietary fiber and superior aroma.',
    price: 245, mrp: 275, stock_quantity: 50, grade_suitability: '5 kg',
    subject_tag: 'Whole Wheat', image_url: 'linear-gradient(135deg, #FEF08A 0%, #EAB308 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'aashirvaad-shudh-chakki-atta-5kg',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'rice-daawat-5kg', category_id: 'atta-rice-dal', sub_category: 'rice',
    name: 'Daawat Rozana Super Basmati Rice', brand: 'Daawat', unit: '5 kg',
    description: 'Fluffy, long grain aromatic basmati rice for daily royal meals.',
    price: 380, mrp: 450, stock_quantity: 40, grade_suitability: '5 kg',
    subject_tag: 'Basmati', image_url: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'daawat-rozana-super-basmati-rice-5kg',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'dal-tata-toor-1kg', category_id: 'atta-rice-dal', sub_category: 'pulses',
    name: 'Tata Sampann Unpolished Toor Dal', brand: 'Tata Sampann', unit: '1 kg',
    description: 'Rich in natural protein, unpolished arhar dal with no artificial colors.',
    price: 175, mrp: 195, stock_quantity: 60, grade_suitability: '1 kg',
    subject_tag: 'Toor Dal', image_url: 'linear-gradient(135deg, #FED7AA 0%, #EA580C 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'tata-sampann-toor-dal-1kg',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },

  // 🫒 Oil, Ghee & Masala
  {
    id: 'oil-fortune-sunflower-1l', category_id: 'oil-ghee-masala', sub_category: 'cooking-oil',
    name: 'Fortune Sunlite Refined Sunflower Oil', brand: 'Fortune', unit: '1 L',
    description: 'Light, healthy cooking oil enriched with Vitamin A and Vitamin D.',
    price: 135, mrp: 160, stock_quantity: 45, grade_suitability: '1 L Pouch',
    subject_tag: 'Cooking Oil', image_url: 'linear-gradient(135deg, #FDE047 0%, #CA8A04 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'fortune-sunlite-sunflower-oil-1l',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'ghee-amul-1l', category_id: 'oil-ghee-masala', sub_category: 'ghee',
    name: 'Amul Pure Desi Ghee', brand: 'Amul', unit: '1 L',
    description: 'Traditional granular rich aroma pure cow and buffalo milk ghee.',
    price: 595, mrp: 650, stock_quantity: 35, grade_suitability: '1 L Carton',
    subject_tag: 'Pure Ghee', image_url: 'linear-gradient(135deg, #FEF08A 0%, #B45309 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'amul-pure-desi-ghee-1l',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'masala-catch-garam-100g', category_id: 'oil-ghee-masala', sub_category: 'spices',
    name: 'Catch Super Garam Masala', brand: 'Catch', unit: '100 g',
    description: 'Authentic blend of aromatic spices for rich Indian curries.',
    price: 75, mrp: 85, stock_quantity: 80, grade_suitability: '100 g Box',
    subject_tag: 'Spices', image_url: 'linear-gradient(135deg, #FCA5A5 0%, #DC2626 100%)',
    is_featured: false, is_bestseller: true, is_active: true, slug: 'catch-garam-masala-100g',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },

  // 🥛 Dairy, Bread & Eggs
  {
    id: 'milk-amul-taaza-1l', category_id: 'dairy-bread-eggs', sub_category: 'milk',
    name: 'Amul Taaza Toned Fresh Milk', brand: 'Amul', unit: '1 L',
    description: 'Fresh homogenised toned milk, rich in calcium and essential vitamins.',
    price: 54, mrp: 56, stock_quantity: 100, grade_suitability: '1 L Tetra',
    subject_tag: 'Fresh Milk', image_url: 'linear-gradient(135deg, #93C5FD 0%, #2563EB 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'amul-taaza-toned-milk-1l',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'butter-amul-500g', category_id: 'dairy-bread-eggs', sub_category: 'butter',
    name: 'Amul Pasteurised Salted Butter', brand: 'Amul', unit: '500 g',
    description: 'Utterly butterly delicious creamy table butter for breakfast toasts.',
    price: 275, mrp: 285, stock_quantity: 60, grade_suitability: '500 g',
    subject_tag: 'Table Butter', image_url: 'linear-gradient(135deg, #FEF08A 0%, #F59E0B 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'amul-salted-butter-500g',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'bread-britannia-wheat-400g', category_id: 'dairy-bread-eggs', sub_category: 'bread',
    name: 'Britannia 100% Whole Wheat Bread', brand: 'Britannia', unit: '400 g',
    description: 'Zero maida, soft sliced healthy whole wheat loaf baked fresh daily.',
    price: 50, mrp: 55, stock_quantity: 40, grade_suitability: '400 g Pack',
    subject_tag: 'Fresh Bread', image_url: 'linear-gradient(135deg, #FDBA74 0%, #C2410C 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'britannia-whole-wheat-bread-400g',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },

  // 🍜 Instant & Frozen
  {
    id: 'instant-maggi-4pack', category_id: 'instant-frozen', sub_category: 'noodles',
    name: 'Maggi 2-Minute Masala Instant Noodles', brand: 'Maggi', unit: 'Pack of 4',
    description: 'Iconic masala flavor instant noodles, favorite snack ready in 2 minutes.',
    price: 56, mrp: 60, stock_quantity: 90, grade_suitability: '4 x 70g Pack',
    subject_tag: 'Instant Noodles', image_url: 'linear-gradient(135deg, #FDE047 0%, #DC2626 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'maggi-2-minute-masala-noodles-4pack',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'clean-lizol-citrus-500ml', category_id: 'cleaning-essentials', sub_category: 'floor-cleaner',
    name: 'Lizol Disinfectant Floor Cleaner (Citrus)', brand: 'Lizol', unit: '500 ml',
    description: 'Kills 99.9% germs, leaves long lasting citrus freshness on all floor surfaces.',
    price: 110, mrp: 125, stock_quantity: 40, grade_suitability: '500 ml Bottle',
    subject_tag: 'Disinfectant', image_url: 'linear-gradient(135deg, #FCD34D 0%, #EA580C 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'lizol-disinfectant-cleaner-citrus-500ml',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'chips-lays-magic-masala-50g', category_id: 'chips-namkeen', sub_category: 'chips',
    name: "Lay's India's Magic Masala Potato Chips", brand: "Lay's", unit: '50 g',
    description: 'Crispy wafer thin potato chips seasoned with aromatic Indian spices.',
    price: 20, mrp: 20, stock_quantity: 120, grade_suitability: '50 g Pouch',
    subject_tag: 'Crisps', image_url: 'linear-gradient(135deg, #60A5FA 0%, #1E40AF 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'lays-magic-masala-chips-50g',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'drink-coke-can-300ml', category_id: 'drinks-juices', sub_category: 'cold-drinks',
    name: 'Coca-Cola Soft Drink Can', brand: 'Coca-Cola', unit: '300 ml',
    description: 'Chilled refreshing sparkling cola, best companion for snacks & meals.',
    price: 40, mrp: 40, stock_quantity: 80, grade_suitability: '300 ml Can',
    subject_tag: 'Cold Drink', image_url: 'linear-gradient(135deg, #F87171 0%, #991B1B 100%)',
    is_featured: true, is_bestseller: true, is_active: true, slug: 'coca-cola-can-300ml',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

const getCategoryDetails = (id: string) => {
  switch (id.toLowerCase()) {
    case 'atta-rice-dal':
      return { name: 'Atta, Rice & Dal', emoji: '🌾', desc: 'Fresh chakki atta, premium basmati rice & unpolished dals', color: '#0C831F', bg: 'linear-gradient(135deg, #0C831F 0%, #15A029 100%)' };
    case 'oil-ghee-masala':
      return { name: 'Oil, Ghee & Masala', emoji: '🫒', desc: 'Refined sunflower oils, pure desi ghee & kitchen spices', color: '#CA8A04', bg: 'linear-gradient(135deg, #FDE047 0%, #CA8A04 100%)' };
    case 'dairy-bread-eggs':
      return { name: 'Dairy, Bread & Eggs', emoji: '🥛', desc: 'Fresh milk, amul butter, whole wheat bread & farm eggs', color: '#2563EB', bg: 'linear-gradient(135deg, #93C5FD 0%, #2563EB 100%)' };
    case 'instant-frozen':
      return { name: 'Instant & Frozen Food', emoji: '🍜', desc: 'Maggi noodles, french fries, ready soups & quick snacks', color: '#DC2626', bg: 'linear-gradient(135deg, #FDE047 0%, #DC2626 100%)' };
    case 'chocolates-sweets':
      return { name: 'Sweets & Chocolates', emoji: '🍫', desc: 'Cadbury silk chocolates, haldiram sweets & desserts', color: '#581C87', bg: 'linear-gradient(135deg, #C084FC 0%, #581C87 100%)' };
    case 'bakery-biscuits':
      return { name: 'Bakery & Biscuits', emoji: '🍪', desc: 'Cashew cookies, Parle-G, cream biscuits & rusks', color: '#D97706', bg: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)' };
    case 'drinks-juices':
      return { name: 'Drinks & Juices', emoji: '🥤', desc: 'Chilled soft drinks, 100% real fruit juices & cold sodas', color: '#991B1B', bg: 'linear-gradient(135deg, #F87171 0%, #991B1B 100%)' };
    case 'chips-namkeen':
      return { name: 'Chips & Namkeen', emoji: '🥨', desc: 'Crispy potato chips, aloo bhujia & teatime savories', color: '#1E40AF', bg: 'linear-gradient(135deg, #60A5FA 0%, #1E40AF 100%)' };
    case 'cleaning-essentials':
      return { name: 'Cleaning Essentials', emoji: '🧼', desc: 'Surface disinfectant cleaners, dishwash gels & detergents', color: '#15803D', bg: 'linear-gradient(135deg, #86EFAC 0%, #15803D 100%)' };
    case 'tea-coffee':
      return { name: 'Tea, Coffee & More', emoji: '☕', desc: 'Premium black leaf tea, Nescafe coffee & beverages', color: '#78350F', bg: 'linear-gradient(135deg, #FDE68A 0%, #78350F 100%)' };
    default:
      return { name: 'All Grocery Items', emoji: '🛒', desc: 'Daily kitchen essentials & groceries delivered in 10-15 mins', color: '#0C831F', bg: 'linear-gradient(135deg, #0C831F 0%, #15A029 100%)' };
  }
};

const CATEGORY_EMOJI: Record<string, string> = {
  'atta-rice-dal': '🌾',
  'oil-ghee-masala': '🫒',
  'dairy-bread-eggs': '🥛',
  'instant-frozen': '🍜',
  'chocolates-sweets': '🍫',
  'bakery-biscuits': '🍪',
  'drinks-juices': '🥤',
  'chips-namkeen': '🥨',
  'cleaning-essentials': '🧼',
  'tea-coffee': '☕',
};

const GRADE_OPTIONS = ['all', '5 kg', '1 kg', '1 L', '500 g', 'Pack of 4', 'Pouch'];

export default function CategoryProductsPage({ params }: { params: { id: string } }) {
  const { addItem } = useCartStore();
  const { addItem: addWish, removeItem: removeWish, isInWishlist } = useWishlistStore();
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
        let filtered = params.id === 'all'
          ? CATALOG_SNAPSHOT
          : CATALOG_SNAPSHOT.filter((p) => p.category_id === params.id);
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
      setProducts(params.id === 'all' ? CATALOG_SNAPSHOT : CATALOG_SNAPSHOT.filter((p) => p.category_id === params.id));
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
