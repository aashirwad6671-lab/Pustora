'use client';
// ProductDetailsClient.tsx
// Client-side interactive product details page (Flipkart-style redesign).

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, Review } from '../../../types';
import { ProductService } from '../../../services/productService';
import { useCartStore } from '../../../store/cartStore';

interface Props {
  slugOrId: string;
  initialProduct?: any;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProductDetailsClient({ slugOrId, initialProduct }: Props) {
  const { items, addItem } = useCartStore();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [frequentBundles, setFrequentBundles] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [animState, setAnimState] = useState<'idle' | 'adding' | 'success'>('idle');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);

  // Flipkart-style Mock Data
  const mockImages = product ? [
    product.image_url || 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    product.image_url ? product.image_url + '?v=2' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    product.image_url ? product.image_url + '?v=3' : 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    product.image_url ? product.image_url + '?v=4' : 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  ] : [];

  const variants = product?.category_id === 'books' 
    ? ['Paperback', 'Hardcover'] 
    : ['Standard', 'Premium'];

  const fallbackReviews: Review[] = [
    {
      id: 'r1', product_id: slugOrId, user_id: 'u1', rating: 5,
      comment: 'Excellent quality, exactly as described! Packaging was very secure and delivery was extremely fast in Gomti Nagar. Highly recommended for students.',
      created_at: new Date().toISOString(),
      profiles: { full_name: 'Anjali Sharma', avatar_url: null },
    },
    {
      id: 'r2', product_id: slugOrId, user_id: 'u2', rating: 4,
      comment: 'Very good product. Matches the syllabus perfectly. Deducted one star because the box was slightly bent, but the inside item was completely safe.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      profiles: { full_name: 'Rajesh Mishra', avatar_url: null },
    },
    {
      id: 'r3', product_id: slugOrId, user_id: 'u3', rating: 5,
      comment: 'Value for money. The paper quality is premium and the print is very clear. Will definitely buy more stationery from Pustora.',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      profiles: { full_name: 'Sneha Verma', avatar_url: null },
    }
  ];

  useEffect(() => {
    if (initialProduct) {
      loadReviewsAndBundles(initialProduct);
    } else {
      loadProductData();
    }
  }, [slugOrId]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const isUuid = UUID_REGEX.test(slugOrId);
      const response = isUuid
        ? await ProductService.getProductById(slugOrId)
        : await ProductService.getProductBySlug(slugOrId);

      const currentProd = response.data ?? null;
      setProduct(currentProd);
      if (currentProd) await loadReviewsAndBundles(currentProd);
    } catch (err: any) {
      setError(err.message || 'Product failed to load.');
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
      }
    } catch {
      setReviews(fallbackReviews);
    }
  };

  const isItemInCart = product ? items.some(i => i.product.id === product.id) : false;

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
      setTimeout(() => setAnimState('idle'), 1000);
    }, 600);
  };

  const discountPct = product && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.6; // Mock high rating if no reviews

  if (loading) {
    return (
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: i === 1 ? '400px' : '150px', borderRadius: '16px' }} />
        ))}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-container" style={{ paddingTop: '60px', paddingBottom: '64px', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>😕</div>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Product Not Found</h1>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '28px' }}>{error || 'This product may have been removed.'}</p>
        <Link href="/" className="stitch-btn">← Back to Store</Link>
      </div>
    );
  }

  const mainImage = mockImages[activeImageIndex];

  return (
    <div style={{ backgroundColor: '#f1f3f6', minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="page-container" style={{ paddingTop: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '16px', fontSize: '12px', color: '#878787', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#878787', textDecoration: 'none' }}>Home</Link>
          <svg width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L4.5 4.5L1 8" stroke="#878787" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <Link href={`/?category=${product.category_id}`} style={{ color: '#878787', textDecoration: 'none', textTransform: 'capitalize' }}>{product.category_id}</Link>
          <svg width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L4.5 4.5L1 8" stroke="#878787" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color: '#212121' }}>{product.name}</span>
        </nav>

        {/* Main Product Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 40%) 1fr', gap: '0', backgroundColor: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)', marginBottom: '16px' }} className="md:grid-cols-[minmax(300px,_40%)_1fr] grid-cols-1">
          
          {/* LEFT: Image Gallery */}
          <div style={{ padding: '24px', display: 'flex', gap: '16px', position: 'relative', borderRight: '1px solid #f0f0f0' }} className="flex-col-reverse md:flex-row">
            {/* Thumbnails */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '400px' }} className="flex-row md:flex-col overflow-x-auto md:overflow-x-hidden pb-2 md:pb-0">
              {mockImages.map((img, idx) => (
                <div 
                  key={idx}
                  onMouseEnter={() => setActiveImageIndex(idx)}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '64px', height: '64px', borderRadius: '4px', border: activeImageIndex === idx ? '2px solid #2874f0' : '1px solid #e0e0e0',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                    background: img.startsWith('linear') ? img : undefined,
                  }}
                >
                  {!img.startsWith('linear') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>{product.category_id === 'books' ? '📚' : product.category_id === 'toys' ? '🧸' : '✏️'}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Main Image */}
            <div style={{ flex: 1, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                width: '100%', height: '100%',
                background: mainImage.startsWith('linear') ? mainImage : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem'
              }}>
                {!mainImage.startsWith('linear') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mainImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span>{product.category_id === 'books' ? '📚' : product.category_id === 'toys' ? '🧸' : '✏️'}</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Product Details */}
          <div style={{ padding: '24px' }}>
            <div style={{ color: '#878787', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              {product.brand}
            </div>
            <h1 style={{ fontSize: '18px', color: '#212121', fontWeight: 400, lineHeight: 1.4, marginBottom: '12px' }}>
              {product.name}
            </h1>

            {/* Ratings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: '#388e3c', color: '#fff', padding: '2px 6px 2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {avgRating.toFixed(1)} ★
              </div>
              <span style={{ color: '#878787', fontSize: '14px', fontWeight: 500 }}>
                {reviews.length * 123 + 45} Ratings & {reviews.length} Reviews
              </span>
            </div>

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'end', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', color: '#212121', fontWeight: 600 }}>₹{product.price.toLocaleString('en-IN')}</span>
              {product.mrp > product.price && (
                <span style={{ fontSize: '16px', color: '#878787', textDecoration: 'line-through', marginBottom: '4px' }}>₹{product.mrp.toLocaleString('en-IN')}</span>
              )}
              {discountPct > 0 && (
                <span style={{ fontSize: '16px', color: '#388e3c', fontWeight: 600, marginBottom: '4px' }}>{discountPct}% off</span>
              )}
            </div>
            
            {/* Offers */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>Available offers</div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '14px', alignItems: 'start', marginBottom: '4px' }}>
                <span style={{ color: '#14952d' }}>🏷️</span>
                <span><b>Bank Offer</b> 5% Unlimited Cashback on Axis Bank Credit Card</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '14px', alignItems: 'start' }}>
                <span style={{ color: '#14952d' }}>🏷️</span>
                <span><b>Special Price</b> Get extra 10% off (price inclusive of cashback/coupon)</span>
              </div>
            </div>

            {/* Variants */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
              <div style={{ color: '#878787', fontSize: '14px', fontWeight: 500, minWidth: '60px' }}>Edition</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {variants.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(idx)}
                    style={{
                      padding: '8px 16px',
                      border: selectedVariant === idx ? '2px solid #2874f0' : '1px solid #e0e0e0',
                      color: selectedVariant === idx ? '#2874f0' : '#212121',
                      background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500, borderRadius: '4px'
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Details */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <div style={{ color: '#878787', fontSize: '14px', fontWeight: 500, minWidth: '60px' }}>Delivery</div>
              <div style={{ fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#212121" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  <span style={{ fontWeight: 600 }}>Delivery to Lucknow - 226001</span>
                </div>
                <div style={{ fontWeight: 600, color: '#212121', marginBottom: '4px' }}>
                  Delivery by Tomorrow, 10:00 PM <span style={{ color: '#388e3c', marginLeft: '8px' }}>Free</span>
                </div>
                <div style={{ color: '#878787', fontSize: '12px' }}>If ordered before 4:00 PM</div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#212121', fontWeight: 500 }}>
                    <span style={{ background: '#f5f5f5', padding: '6px', borderRadius: '50%' }}>💸</span>
                    Cash on Delivery
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#212121', fontWeight: 500 }}>
                    <span style={{ background: '#f5f5f5', padding: '6px', borderRadius: '50%' }}>🔄</span>
                    10 Days Return
                  </div>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <div style={{ color: '#878787', fontSize: '14px', fontWeight: 500, minWidth: '60px' }}>Highlights</div>
              <ul style={{ margin: 0, padding: 0, paddingLeft: '16px', fontSize: '14px', color: '#212121', lineHeight: 1.6 }}>
                <li>Premium Quality Material</li>
                <li>Latest Edition / Syllabus</li>
                <li>Dispatched directly from Lucknow Hub</li>
                <li>{product.grade_suitability ? `Suitable for ${product.grade_suitability}` : 'Standard Warranty'}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || animState !== 'idle'}
                style={{
                  flex: 1, padding: '16px', fontSize: '16px', fontWeight: 600, color: '#fff',
                  backgroundColor: (isItemInCart || animState === 'success') ? '#10B981' : '#ff9f00',
                  border: 'none', borderRadius: '2px', cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  transform: animState === 'adding' ? 'scale(0.98)' : 'scale(1)'
                }}
              >
                {animState === 'adding' ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Adding...
                  </>
                ) : animState === 'success' ? (
                  <>✅ Added to Cart</>
                ) : isItemInCart ? (
                  <>▶ GO TO CART</>
                ) : (
                  <>🛒 ADD TO CART</>
                )}
              </button>
              <button
                disabled={product.stock_quantity === 0}
                style={{
                  flex: 1, padding: '16px', fontSize: '16px', fontWeight: 600, color: '#fff',
                  backgroundColor: '#fb641b', border: 'none', borderRadius: '2px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.2)'
                }}
              >
                ⚡ BUY NOW
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {frequentBundles.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '24px', color: '#212121' }}>Similar Products</h2>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
              {frequentBundles.map((p) => (
                <Link key={p.id} href={`/product/${(p as any).slug || p.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '200px' }}>
                  <div className="hover:shadow-lg transition-shadow" style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '4px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ height: '150px', background: p.image_url || 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '16px' }}>
                      {(!p.image_url || p.image_url.startsWith('linear')) && '📚'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#212121', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '8px' }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <span style={{ background: '#388e3c', color: '#fff', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>4.4 ★</span>
                      <span style={{ color: '#878787', fontSize: '12px' }}>(1,200)</span>
                    </div>
                    <div style={{ fontSize: '16px', color: '#212121', fontWeight: 600, marginTop: 'auto' }}>
                      ₹{p.price}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ratings & Reviews */}
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 500, color: '#212121', margin: 0 }}>Ratings & Reviews</h2>
            <button style={{ padding: '10px 24px', backgroundColor: '#fff', color: '#212121', border: '1px solid #e0e0e0', borderRadius: '2px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)' }}>
              Rate Product
            </button>
          </div>

          <div style={{ display: 'flex', gap: '48px', marginBottom: '32px', borderBottom: '1px solid #f0f0f0', paddingBottom: '32px' }} className="flex-col md:flex-row">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 400, color: '#212121', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {avgRating.toFixed(1)} <span style={{ fontSize: '24px' }}>★</span>
              </div>
              <div style={{ color: '#878787', fontSize: '14px', marginTop: '4px' }}>
                {reviews.length * 123 + 45} Ratings &<br/>{reviews.length} Reviews
              </div>
            </div>
            
            <div style={{ flex: 1, maxWidth: '300px' }}>
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#212121', width: '20px', textAlign: 'right' }}>{star} ★</div>
                  <div style={{ flex: 1, height: '5px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: star >= 4 ? '#388e3c' : star === 3 ? '#ff9f00' : '#ff6161', width: `${star * 15 + Math.random() * 20}%` }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#878787', width: '30px' }}>{Math.floor(Math.random() * 500)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {reviews.map((review, i) => (
              <div key={review.id} style={{ borderBottom: i < reviews.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: i < reviews.length - 1 ? '24px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ background: review.rating >= 4 ? '#388e3c' : '#ff9f00', color: '#fff', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {review.rating} ★
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#212121' }}>{review.rating >= 4 ? 'Awesome' : 'Good'}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#212121', lineHeight: 1.5, margin: 0, marginBottom: '12px' }}>
                  {review.comment}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#878787' }}>
                  <span style={{ fontWeight: 500 }}>{review.profiles?.full_name || 'Flipkart Customer'}</span>
                  <span>✔ Certified Buyer, Lucknow</span>
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
