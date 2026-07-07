'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Category } from '../types';
import { ProductService } from '../services/productService';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import { useWebVoiceAgent } from '../hooks/useWebVoiceAgent';
import VoiceAssistantOverlay from '../components/VoiceAssistantOverlay';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CategoryStrip from '../components/CategoryStrip';
import ProductGrid from '../components/ProductGrid';
import FlashDealsBanner from '../components/FlashDealsBanner';
import Footer from '../components/Footer';
import BestSellers from '../components/BestSellers';
import Testimonials from '../components/Testimonials';
import AppBanner from '../components/AppBanner';

export default function HomePage() {
  const { user, isAuthenticated, setSession } = useAuthStore();
  const { items, addItem } = useCartStore();
  const { nearestStore, distanceKm, setDeliveryAddress, fetchStores, availableStores } = useLocationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [splashParticles, setSplashParticles] = useState<{ id: number; x: string; y: string }[]>([]);

  const demoProducts: Product[] = [
    {
      id: 'tb-ncert-m6', category_id: 'books', sub_category: 'textbooks',
      name: 'Mathematics Class VI (NCERT)', brand: 'NCERT',
      description: 'Official CBSE Class 6 Mathematics textbook. Covers numbers, fractions, geometry, algebra, and data handling.',
      price: 150, mrp: 150, stock_quantity: 45, grade_suitability: 'Class 6',
      subject_tag: 'Mathematics', image_url: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
      is_featured: true, is_bestseller: true, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'tb-ncert-s10', category_id: 'books', sub_category: 'textbooks',
      name: 'Science Class X (NCERT)', brand: 'NCERT',
      description: 'Official CBSE Class 10 Science textbook. Covers chemical reactions, life processes, electricity, light, and magnetic effects.',
      price: 195, mrp: 195, stock_quantity: 30, grade_suitability: 'Class 10',
      subject_tag: 'Science', image_url: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      is_featured: true, is_bestseller: true, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'nb-classmate-s6', category_id: 'stationery', sub_category: 'notebooks',
      name: 'Classmate Notebook Pack of 6', brand: 'Classmate',
      description: 'Premium quality softcover single line notebooks. 172 pages per book, eco-friendly papers.',
      price: 360, mrp: 390, stock_quantity: 25, grade_suitability: 'All Grades',
      subject_tag: 'General', image_url: 'linear-gradient(135deg, #F5A623 0%, #D97706 100%)',
      is_featured: true, is_bestseller: true, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'toy-lego-classic', category_id: 'toys', sub_category: 'building-blocks',
      name: 'LEGO Creative Bricks (484 Pcs)', brand: 'LEGO',
      description: 'Medium creative brick box featuring 35 colors. Endless custom structural designs and cognitive logic development.',
      price: 1599, mrp: 1799, stock_quantity: 12, grade_suitability: 'Age 4+',
      subject_tag: 'Creative', image_url: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
      is_featured: true, is_bestseller: true, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  ];

  const demoCategories: Category[] = [
    { id: 'all', name: 'All Products', emoji: '✨', sort_order: 1, is_active: true, created_at: '' },
    { id: 'books', name: 'NCERT Books', emoji: '📚', sort_order: 2, is_active: true, created_at: '' },
    { id: 'stationery', name: 'Stationery', emoji: '✏️', sort_order: 3, is_active: true, created_at: '' },
    { id: 'toys', name: 'Toys & Gifts', emoji: '🎁', sort_order: 4, is_active: true, created_at: '' },
  ];

  const onboardingSlides = [
    {
      emoji: '📚',
      title: 'School Essentials Delivered in 1-2 Days',
      desc: 'Get original CBSE & NCERT textbooks, guides, stationery kits, and school uniforms dispatched from closest Lucknow hubs.',
    },
    {
      emoji: '✏️',
      title: 'Premium Brand Stationery & Tools',
      desc: 'Classmate notebooks, Camel paint sets, Maped compass kits, and calculators kept fully stocked in local zones.',
    },
    {
      emoji: '🎁',
      title: 'Cognitive Mind Toys & Birthday Gifts',
      desc: 'Encourage brain development with Lego sets, puzzle blocks, premium board games, and elegant greeting cards.',
    },
  ];

  useEffect(() => {
    fetchStores();
    setCategories(demoCategories);
    loadCatalogData();

    const particles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: `${(Math.random() - 0.5) * 300}px`,
      y: `${(Math.random() - 0.5) * 300}px`,
    }));
    setSplashParticles(particles);

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    const handleAuthSkipped = () => {
      if (!isAuthenticated || !user?.role) {
        setShowOnboarding(true);
      }
    };
    window.addEventListener('authSkipped', handleAuthSkipped);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('authSkipped', handleAuthSkipped);
    };
  }, []);

  useEffect(() => {
    if (availableStores.length > 0 && !selectedStoreId) {
      const firstStore = availableStores[0];
      setSelectedStoreId(firstStore.id);
      setDeliveryAddress(firstStore.address, firstStore.latitude, firstStore.longitude);
    }
  }, [availableStores]);

  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const filter: any = {};
      if (selectedCategory !== 'all') filter.categoryId = selectedCategory;
      if (searchQuery) filter.searchQuery = searchQuery;

      const response = await ProductService.getProducts(filter);
      if (response.data && response.data.length > 0) {
        setProducts(response.data);
      } else {
        let filtered = demoProducts;
        if (selectedCategory !== 'all') filtered = filtered.filter((p) => p.category_id === selectedCategory);
        if (searchQuery) {
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.brand.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setProducts(filtered);
      }
    } catch {
      setProducts(demoProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCatalogData(); }, [selectedCategory, searchQuery]);

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const storeId = e.target.value;
    if (storeId === 'add_address') {
      window.location.href = '/setup';
      return;
    }
    setSelectedStoreId(storeId);
    const store = availableStores.find((s) => s.id === storeId);
    if (store) setDeliveryAddress(store.address, store.latitude, store.longitude);
  };

  const handleVoiceIntent = (intent: any) => {
    if (intent.action === 'search') {
      if (intent.payload?.categoryId) setSelectedCategory(intent.payload.categoryId);
      if (intent.payload?.query) setSearchQuery(intent.payload.query);
    } else if (intent.action === 'add_to_cart') {
      const prodId = intent.payload?.productId;
      const qty = intent.payload?.quantity || 1;
      const targetProd = demoProducts.find((p) => p.id === prodId) || products.find((p) => p.id === prodId);
      if (targetProd) addItem(targetProd, qty);
    } else if (intent.action === 'checkout') {
      window.location.href = '/cart';
    }
  };

  const {
    isRecording, isAnalyzing, transcript, aiResponse, error: voiceError,
    startRecording, stopRecording, clearState: clearVoiceState,
  } = useWebVoiceAgent(handleVoiceIntent);

  const toggleVoiceRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleRoleSelection = (role: 'student' | 'parent' | 'teacher' | 'general') => {
    if (isAuthenticated && user) setSession({ ...user, role }, 'valid-session-jwt');
    setShowOnboarding(false);
  };

  // ── SPLASH SCREEN ──
  if (showSplash) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#F8F4FF',
        width: '100%',
      }}>
        {splashParticles.map((p) => (
          <span key={p.id} className="splash-particle"
            style={{ '--x': p.x, '--y': p.y, left: '50%', top: '50%', animationDelay: `${Math.random() * 0.4}s` } as React.CSSProperties}
          />
        ))}
        <div className="splash-logo-anim" style={{ zIndex: 10, textAlign: 'center' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '3rem', color: 'var(--primary)', letterSpacing: '0.2em', display: 'block' }}>
            PUSTORA
          </span>
          <div style={{ height: '6px', width: '96px', margin: '12px auto', borderRadius: '9999px', background: 'var(--primary-gradient)' }} />
          <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', fontWeight: 700 }}>
            "Har Zaroorat, Ek App"
          </p>
        </div>
        <span style={{ position: 'absolute', bottom: '2rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C5E94', fontWeight: 700 }}>
          Lucknow Active Hubs Dispatch
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background)', width: '100%' }}>

      {/* ── ONBOARDING MODAL ── */}
      {showOnboarding && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}>
          <div className="stitch-card" style={{ maxWidth: '420px', width: '100%', position: 'relative', padding: '2rem' }}>
            <button
              onClick={() => setShowOnboarding(false)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px' }}
            >
              Skip
            </button>

            <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '3.75rem', display: 'block' }}>
                {onboardingSlides[onboardingSlide].emoji}
              </span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: 'var(--deep-text)' }}>
                {onboardingSlides[onboardingSlide].title}
              </h3>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--on-surface-variant)' }}>
                {onboardingSlides[onboardingSlide].desc}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '8px 0 20px' }}>
              {onboardingSlides.map((_, i) => (
                <span key={i} style={{
                  height: '10px', width: onboardingSlide === i ? '24px' : '10px',
                  borderRadius: '9999px',
                  background: onboardingSlide === i ? 'var(--primary)' : 'var(--outline)',
                  transition: 'all 0.2s ease',
                }} />
              ))}
            </div>

            {onboardingSlide < 2 ? (
              <button onClick={() => setOnboardingSlide(onboardingSlide + 1)} className="stitch-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Next Step
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--outline)' }}>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                  Choose Your School Role
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(['student', 'parent', 'teacher', 'general'] as const).map((role) => (
                    <button key={role} onClick={() => handleRoleSelection(role)} className="stitch-btn-secondary"
                      style={{ textTransform: 'capitalize', justifyContent: 'center', minHeight: '44px' }}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStoreId={selectedStoreId}
        onStoreChange={handleStoreChange}
        availableStores={availableStores}
        distanceKm={distanceKm}
      />

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" id="main-content">
        <div className="page-container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingTop: '28px', paddingBottom: '64px' }}>

            {/* Step 2 — Hero Section */}
            <HeroSection />
            {/* Step 3 — Category Grid */}
            <CategoryStrip
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />

            {/* 3D Bookshelf (books category) */}
            {(selectedCategory === 'books' || selectedCategory === 'all') && (
              <section aria-label="NCERT Bookshelf">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">📚 Interactive 3D Bookshelf</h2>
                    <p className="section-subtitle">CBSE / UP Board — hover to rotate covers</p>
                  </div>
                  <span className="section-badge">CBSE Class 1–12</span>
                </div>
                <div className="bookshelf">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '2rem', justifyItems: 'center' }}>
                    {demoProducts.filter((p) => p.category_id === 'books').map((book) => (
                      <div key={book.id} className="book-3d" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Link href={`/product/${book.id}`} style={{ display: 'block' }}>
                          <div className="book-3d-cover" style={{ background: book.image_url || 'var(--primary-gradient)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px' }}>
                            <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
                              {book.brand}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
                              {book.name.replace(' (NCERT)', '')}
                            </span>
                            <span style={{ background: '#fff', color: '#000', fontSize: '8px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', margin: '0 auto' }}>
                              {book.grade_suitability}
                            </span>
                          </div>
                        </Link>
                        <h3 style={{ fontWeight: 700, fontSize: '0.75rem', marginTop: '12px', color: 'var(--deep-text)', maxWidth: '120px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                          {book.name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '2px', color: 'var(--primary)' }}>₹{book.price}</span>
                        <button onClick={() => addItem(book, 1)} className="stitch-btn" style={{ marginTop: '10px', padding: '0.4rem 1rem', minHeight: '36px', fontSize: '0.75rem' }} id={`btn-shelf-add-${book.id}`}>
                          Quick Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Best Sellers row — below How It Works */}
            <BestSellers products={demoProducts} onAddToCart={(p) => addItem(p, 1)} />

            {/* Flash Deals Banner */}
            <FlashDealsBanner products={demoProducts} onAddToCart={(p) => addItem(p, 1)} />

            {/* Browse / Product Grid */}
            <ProductGrid products={products} loading={loading} onAddToCart={(p) => addItem(p, 1)} />

            {/* Testimonials */}
            <Testimonials />

            {/* Shop by Category Grid */}
            <section aria-label="Shop by category">
              <div className="section-header">
                <h2 className="section-title">🛍️ Shop By Category</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                {demoCategories.map((c) => (
                  <button key={c.id} onClick={() => setSelectedCategory(c.id)} className="stitch-card stitch-card-hover"
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '28px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>{c.emoji}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--deep-text)' }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </section>



          </div>
        </div>
      </main>

      {/* ── APP BANNER ── */}
      <AppBanner />

      {/* ── FOOTER ── */}
      <Footer />

      {/* ── AI VOICE OVERLAY (modal only, no floating FAB) ── */}
      <VoiceAssistantOverlay
        isOpen={isVoiceOpen}
        isRecording={isRecording}
        isAnalyzing={isAnalyzing}
        transcript={transcript}
        aiResponse={aiResponse}
        error={voiceError}
        onClose={() => { setIsVoiceOpen(false); clearVoiceState(); }}
        onRecordToggle={toggleVoiceRecording}
      />
    </div>
  );
}
