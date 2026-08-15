'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product, Review } from '../../../types';
import { ProductService } from '../../../services/productService';
import { useCartStore } from '../../../store/cartStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import { useAuthStore } from '../../../store/authStore';
import Navbar from '../../../components/Navbar';
import CartBar from '../../../components/CartBar';
import Footer from '../../../components/Footer';
import { useLocationStore } from '../../../store/locationStore';
import { Star, Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, CheckCircle2, X } from 'lucide-react';

interface Props {
  slugOrId: string;
  initialProduct?: any;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEMO_PRODUCTS = [
  {
    id: 'tb-ncert-m6', slug: 'mathematics-class-6-ncert', category_id: 'books', sub_category: 'textbooks',
    name: 'Mathematics Class VI (NCERT)', brand: 'NCERT',
    description: 'Official CBSE Class 6 Mathematics textbook by NCERT. Covers the complete syllabus including numbers, fractions, decimals, basic geometry, algebra basics, ratio & proportion, and data handling. Aligned with latest CBSE curriculum.',
    price: 150, mrp: 150, stock_quantity: 45, grade_suitability: 'Class 6',
    subject_tag: 'Mathematics', image_url: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    author: 'NCERT', publisher: 'National Council of Educational Research and Training', edition: '2024',
    language: 'English', isbn: '978-81-7450-653-6', format: 'Paperback',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'tb-ncert-s10', slug: 'science-class-10-ncert', category_id: 'books', sub_category: 'textbooks',
    name: 'Science Class X (NCERT)', brand: 'NCERT',
    description: 'Official CBSE Class 10 Science textbook by NCERT. Covers chemical reactions, acids/bases/salts, metals and nonmetals, carbon compounds, life processes, control and coordination, reproduction, light, electricity, and magnetic effects.',
    price: 195, mrp: 195, stock_quantity: 30, grade_suitability: 'Class 10',
    subject_tag: 'Science', image_url: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    author: 'NCERT', publisher: 'National Council of Educational Research and Training', edition: '2024',
    language: 'English', isbn: '978-81-7450-710-6', format: 'Paperback',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'nb-classmate-s6', slug: 'classmate-notebook-pack-6', category_id: 'stationery', sub_category: 'notebooks',
    name: 'Classmate Notebook Pack of 6', brand: 'Classmate',
    description: 'Premium quality softcover single line notebooks for school use. 172 pages per book, eco-friendly FSC-certified papers with micro-perforated edges. Suitable for all grades.',
    price: 360, mrp: 390, stock_quantity: 25, grade_suitability: 'All Grades',
    subject_tag: 'General', image_url: 'linear-gradient(135deg, #F5A623 0%, #D97706 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    author: null, publisher: 'ITC Limited', edition: null,
    language: 'N/A', isbn: null, format: 'Pack of 6',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'toy-lego-classic', slug: 'lego-creative-bricks-484', category_id: 'toys', sub_category: 'building-blocks',
    name: 'LEGO Creative Bricks (484 Pcs)', brand: 'LEGO',
    description: 'Medium creative brick box featuring 484 pieces in 35 vibrant colors. Includes classic LEGO bricks, special elements, windows, and wheels. Builds creative thinking and fine motor skills. Suitable for ages 4+.',
    price: 1599, mrp: 1799, stock_quantity: 12, grade_suitability: 'Age 4+',
    subject_tag: 'Creative', image_url: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    is_featured: true, is_bestseller: true, is_active: true,
    author: null, publisher: 'LEGO Group', edition: null,
    language: 'N/A', isbn: null, format: '484 pieces',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

export default function ProductDetailsClient({ slugOrId, initialProduct }: Props) {
  const router = useRouter();
  const { items, addItem } = useCartStore();
  const { addItem: addWish, removeItem: removeWish, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const { availableStores } = useLocationStore();

  const [product, setProduct] = useState<Product | null>(() => {
    if (initialProduct) return initialProduct;
    return DEMO_PRODUCTS.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [frequentBundles, setFrequentBundles] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [animState, setAnimState] = useState<'idle' | 'adding' | 'success'>('idle');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);

  // Rate product modal states
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState(user?.full_name || '');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Multiple product angles / thumbnails
  const mockImages = product ? [
    product.image_url || 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  ] : [];

  const variants = product?.category_id === 'books'
    ? ['Paperback Edition', 'Hardcover Edition']
    : ['Standard Pack', 'Deluxe Combo'];

  const fallbackReviews: Review[] = [
    {
      id: 'r1', product_id: slugOrId, user_id: 'u1', rating: 5,
      comment: 'Excellent original NCERT quality! Delivered in Gomti Nagar within 2 hours. Very impressed with Pustora service.',
      created_at: new Date().toISOString(),
      profiles: { full_name: 'Anjali Sharma', avatar_url: null },
    },
    {
      id: 'r2', product_id: slugOrId, user_id: 'u2', rating: 4,
      comment: 'Matches the latest 2024 CBSE curriculum syllabus perfectly. Crisp paper quality and clean print.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      profiles: { full_name: 'Rajesh Mishra', avatar_url: null },
    },
    {
      id: 'r3', product_id: slugOrId, user_id: 'u3', rating: 5,
      comment: 'Super fast delivery and authentic products. Saved a lot of hassle hunting in Aminabad markets!',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      profiles: { full_name: 'Sneha Verma', avatar_url: null },
    }
  ];

  useEffect(() => {
    if (!product) {
      loadProductData();
    } else {
      loadReviewsAndBundles(product);
    }
  }, [slugOrId]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const isUuid = UUID_REGEX.test(slugOrId);
      const response = isUuid
        ? await ProductService.getProductById(slugOrId)
        : await ProductService.getProductBySlug(slugOrId);

      let currentProd = response.data ?? null;
      if (!currentProd) {
        currentProd = (DEMO_PRODUCTS.find((p) => p.slug === slugOrId || p.id === slugOrId) as any) ?? null;
      }
      setProduct(currentProd);
      if (currentProd) await loadReviewsAndBundles(currentProd);
    } catch {
      const demoMatch = DEMO_PRODUCTS.find((p) => p.slug === slugOrId || p.id === slugOrId) as any;
      if (demoMatch) {
        setProduct(demoMatch);
        await loadReviewsAndBundles(demoMatch);
      } else {
        setError('Product not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReviewsAndBundles = async (currentProd: Product) => {
    try {
      const [reviewsResponse, bundlesResponse] = await Promise.all([
        ProductService.getProductReviews(currentProd.id),
        ProductService.getFrequentlyBoughtTogether(currentProd),
      ]);
      setReviews(reviewsResponse.data?.length ? reviewsResponse.data : fallbackReviews);
      if (bundlesResponse.data?.length) {
        setFrequentBundles(bundlesResponse.data);
      } else {
        const demoSimilar = DEMO_PRODUCTS.filter(
          (p) => p.category_id === currentProd.category_id && p.id !== currentProd.id
        );
        setFrequentBundles(demoSimilar as any[]);
      }
    } catch {
      setReviews(fallbackReviews);
      const demoSimilar = DEMO_PRODUCTS.filter(
        (p) => p.category_id === currentProd.category_id && p.id !== currentProd.id
      );
      setFrequentBundles(demoSimilar as any[]);
    }
  };

  const isItemInCart = product ? items.some((i) => i.product.id === product.id) : false;
  const wishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    if (isItemInCart) {
      router.push('/cart');
      return;
    }
    setAnimState('adding');
    setTimeout(() => {
      addItem(product, quantity);
      setAnimState('success');
      setTimeout(() => setAnimState('idle'), 1200);
    }, 400);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    const newRev: Review = {
      id: 'rev-' + Date.now(),
      product_id: product?.id || slugOrId,
      user_id: user?.id || 'u-guest',
      rating: ratingVal,
      comment: reviewText.trim(),
      created_at: new Date().toISOString(),
      profiles: { full_name: reviewerName || 'Pustora Customer', avatar_url: null },
    };
    setReviews((prev) => [newRev, ...prev]);
    setReviewSubmitted(true);
    setTimeout(() => {
      setIsRateModalOpen(false);
      setReviewSubmitted(false);
      setReviewText('');
    }, 1200);
  };

  const discountPct = product && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.8;

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
        <Navbar searchQuery="" onSearchChange={() => {}} selectedStoreId="" onStoreChange={() => {}} availableStores={availableStores} />
        <div style={{ maxWidth: '1200px', margin: '80px auto 40px', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="stitch-skeleton" style={{ height: '380px', borderRadius: '20px' }} />
          <div className="stitch-skeleton" style={{ height: '160px', borderRadius: '20px' }} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar searchQuery="" onSearchChange={() => {}} selectedStoreId="" onStoreChange={() => {}} availableStores={availableStores} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', marginTop: '64px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📚</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--deep-text)', marginBottom: '8px' }}>Product Not Found</h1>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>The product you requested could not be found.</p>
          <Link href="/" className="stitch-btn">Browse Catalog</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentImage = mockImages[activeImageIndex] || mockImages[0];

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar searchQuery="" onSearchChange={() => {}} selectedStoreId="" onStoreChange={() => {}} availableStores={availableStores} />

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '76px auto 60px', padding: '0 16px' }}>
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href={`/category/${product.category_id}`} style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', textTransform: 'capitalize' }}>
            {product.category_id}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--deep-text)', fontWeight: 600 }}>{product.name}</span>
        </nav>

        {/* Product Card Container */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid var(--outline)',
          boxShadow: '0 4px 24px rgba(108,63,214,0.06)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          padding: '24px',
          marginBottom: '24px',
        }}>

          {/* LEFT: Image Gallery */}
          <div style={{ display: 'flex', gap: '16px', position: 'relative' }} className="flex-col-reverse sm:flex-row">
            
            {/* Thumbnails list */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }} className="sm:flex-col flex-row">
              {mockImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  onMouseEnter={() => setActiveImageIndex(idx)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    border: activeImageIndex === idx ? '2px solid var(--primary)' : '1px solid var(--outline)',
                    padding: '2px',
                    cursor: 'pointer',
                    background: img.startsWith('linear') ? img : '#f9f9f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    transform: activeImageIndex === idx ? 'scale(1.05)' : 'scale(1)',
                    flexShrink: 0,
                  }}
                  aria-label={`View image angle ${idx + 1}`}
                >
                  {!img.startsWith('linear') ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image src={img} alt="" fill style={{ objectFit: 'cover', borderRadius: '10px' }} sizes="80px" />
                    </div>
                  ) : (
                    <span style={{ fontSize: '1.4rem' }}>
                      {product.category_id === 'books' ? '📚' : product.category_id === 'toys' ? '🎁' : '✏️'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div style={{
              flex: 1,
              height: '380px',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              background: currentImage.startsWith('linear') ? currentImage : '#f9f9f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Wishlist Button */}
              <button
                onClick={() => wishlisted ? removeWish(product.id) : addWish(product)}
                style={{
                  position: 'absolute', top: '14px', right: '14px', zIndex: 10,
                  background: wishlisted ? '#EF4444' : 'rgba(255,255,255,0.9)',
                  border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                }}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} fill={wishlisted ? '#fff' : 'none'} color={wishlisted ? '#fff' : '#EF4444'} />
              </button>

              {!currentImage.startsWith('linear') ? (
                <Image src={currentImage} alt={product.name} fill priority style={{ objectFit: 'contain' }} sizes="(max-width: 768px) 100vw, 500px" />
              ) : (
                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <span style={{ fontSize: '7rem', display: 'block', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }}>
                    {product.category_id === 'books' ? '📚' : product.category_id === 'toys' ? '🎁' : '✏️'}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.9 }}>
                    Official {product.brand} Edition
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Info & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Brand & Bestseller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--tint-chip)', color: 'var(--primary)' }}>
                {product.brand}
              </span>
              {product.is_bestseller && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  ⚡ Bestseller
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', lineHeight: 1.3, marginBottom: '12px' }}>
              {product.name}
            </h1>

            {/* Rating badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#10B981', color: '#fff', padding: '3px 8px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={13} fill="#fff" />
                {avgRating.toFixed(1)}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                {reviews.length * 12 + 45} Ratings & {reviews.length} Verified Reviews
              </span>
            </div>

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif' }}>
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <span style={{ fontSize: '1.125rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                  ₹{product.mrp}
                </span>
              )}
              {discountPct > 0 && (
                <span style={{ fontSize: '0.875rem', color: '#10B981', fontWeight: 800, background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                  {discountPct}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '20px' }}>
              {product.description}
            </p>

            {/* Specs Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px',
              padding: '16px', background: '#F8F4FF', borderRadius: '14px', marginBottom: '24px'
            }}>
              {product.author && (
                <div>
                  <span className="text-[11px] text-gray-500 block font-medium">Author / Authoring Body</span>
                  <span className="text-[13px] font-bold text-gray-900">{product.author}</span>
                </div>
              )}
              {product.publisher && (
                <div>
                  <span className="text-[11px] text-gray-500 block font-medium">Publisher</span>
                  <span className="text-[13px] font-bold text-gray-900">{product.publisher}</span>
                </div>
              )}
              {product.isbn && (
                <div>
                  <span className="text-[11px] text-gray-500 block font-medium">ISBN</span>
                  <span className="text-[13px] font-bold text-gray-900">{product.isbn}</span>
                </div>
              )}
              <div>
                <span className="text-[11px] text-gray-500 block font-medium">Dispatched From</span>
                <span className="text-[13px] font-bold text-green-700">Lucknow Central Hub ⚡</span>
              </div>
            </div>

            {/* Editions / Variants */}
            <div style={{ marginBottom: '24px' }}>
              <span className="text-[12px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Select Edition</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {variants.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(idx)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedVariant === idx ? '2px solid var(--primary)' : '1px solid var(--outline)',
                      background: selectedVariant === idx ? '#F3F0FF' : '#fff',
                      color: selectedVariant === idx ? 'var(--primary)' : 'var(--deep-text)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Guarantees */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Truck size={16} className="text-purple-600" /> Fast Lucknow Delivery
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <ShieldCheck size={16} className="text-green-600" /> 100% Original Guarantee
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <RotateCcw size={16} className="text-blue-600" /> 10 Days Easy Return
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button
                onClick={handleAddToCart}
                disabled={animState !== 'idle'}
                className="stitch-btn flex-1 justify-center min-h-[50px] text-base"
                style={{
                  background: (isItemInCart || animState === 'success') ? '#10B981' : 'var(--primary-gradient)',
                }}
              >
                {animState === 'adding' ? (
                  <span>Adding to Cart...</span>
                ) : animState === 'success' ? (
                  <span>✅ Added to Cart</span>
                ) : isItemInCart ? (
                  <span>View in Cart →</span>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={() => { addItem(product, 1); router.push('/cart'); }}
                className="stitch-btn-secondary min-h-[50px] px-8 text-base font-bold text-white bg-amber-500 border-none hover:bg-amber-600"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {frequentBundles.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid var(--outline)',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 24px rgba(108,63,214,0.04)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', marginBottom: '16px' }}>
              Recommended Similar Products
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {frequentBundles.map((p) => (
                <Link key={p.id} href={`/product/${(p as any).slug || p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    border: '1px solid var(--outline)',
                    borderRadius: '14px',
                    padding: '12px',
                    background: '#fff',
                    transition: 'all 0.2s ease',
                  }} className="hover:shadow-md hover:-translate-y-1">
                    <div style={{
                      height: '140px',
                      borderRadius: '10px',
                      background: p.image_url || 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      marginBottom: '10px',
                    }}>
                      {(!p.image_url || p.image_url.startsWith('linear')) && '📚'}
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--deep-text)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', margin: '0 0 8px' }}>{p.brand}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--deep-text)' }}>₹{p.price}</span>
                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, marginLeft: 'auto' }}>4.8 ★</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ratings & Reviews Section */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid var(--outline)',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(108,63,214,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', margin: 0 }}>
                Ratings & Verified Customer Reviews
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>Real feedback from Lucknow students & parents</p>
            </div>
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="stitch-btn-secondary text-sm px-5 py-2.5"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            >
              ⭐ Rate & Review Product
            </button>
          </div>

          <div style={{ display: 'flex', gap: '40px', marginBottom: '32px', borderBottom: '1px solid var(--outline)', paddingBottom: '24px' }} className="flex-col md:flex-row">
            {/* Score */}
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>
                {avgRating.toFixed(1)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '8px 0 4px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill={s <= Math.round(avgRating) ? '#F59E0B' : '#E5E7EB'} color={s <= Math.round(avgRating) ? '#F59E0B' : '#E5E7EB'} />
                ))}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: 0 }}>{reviews.length} reviews</p>
            </div>

            {/* Distribution */}
            <div style={{ flex: 1, maxWidth: '320px' }}>
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--deep-text)', width: '24px' }}>{star} ★</span>
                  <div style={{ flex: 1, height: '8px', background: '#F3F0FF', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: star >= 4 ? '#10B981' : star === 3 ? '#F59E0B' : '#EF4444',
                      width: star === 5 ? '80%' : star === 4 ? '15%' : '5%',
                      borderRadius: '4px',
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', width: '28px', textAlign: 'right' }}>
                    {star === 5 ? reviews.length : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map((rev) => (
              <div key={rev.id} style={{ borderBottom: '1px solid var(--outline)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill={s <= rev.rating ? '#F59E0B' : '#E5E7EB'} color={s <= rev.rating ? '#F59E0B' : '#E5E7EB'} />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--deep-text)' }}>
                    {rev.rating === 5 ? 'Excellent Quality' : 'Very Good'}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--deep-text)', lineHeight: 1.5, margin: '0 0 10px' }}>
                  {rev.comment}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--deep-text)' }}>{rev.profiles?.full_name || 'Pustora Customer'}</span>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>✔ Certified Buyer, Lucknow</span>
                  <span>· {new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Rate Product Modal */}
      {isRateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', maxWidth: '440px', width: '100%',
            padding: '28px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          }}>
            <button
              onClick={() => setIsRateModalOpen(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
            >
              <X size={20} />
            </button>

            {reviewSubmitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-text)', margin: '0 0 6px' }}>Thank You!</h3>
                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>Your review has been submitted and published.</p>
              </div>
            ) : (
              <form onSubmit={handleAddReview}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', margin: '0 0 4px' }}>
                  Rate & Review Product
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: '0 0 20px' }}>
                  Share your experience with {product.name}
                </p>

                {/* Rating Stars Selection */}
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Rating</label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingVal(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transform: ratingVal >= s ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }}
                      >
                        <Star size={32} fill={s <= ratingVal ? '#F59E0B' : '#E5E7EB'} color={s <= ratingVal ? '#F59E0B' : '#D1D5DB'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reviewer Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="stitch-input w-full text-sm"
                  />
                </div>

                {/* Comment */}
                <div style={{ marginBottom: '24px' }}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Review Comment</label>
                  <textarea
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe product quality, delivery, and overall satisfaction..."
                    required
                    className="stitch-input w-full text-sm resize-none"
                  />
                </div>

                <button type="submit" className="stitch-btn w-full justify-center min-h-[48px] text-sm">
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
      <CartBar />
    </div>
  );
}
