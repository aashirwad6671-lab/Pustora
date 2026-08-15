'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

const CATEGORY_EMOJI: Record<string, string> = {
  books: '📚', stationery: '✏️', toys: '🎁', art: '🎨',
};

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pb-20" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
      <div className="w-full max-w-lg bg-gray-50 min-h-screen sm:border-x sm:border-gray-200 sm:shadow-sm flex flex-col">

        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => router.back()} className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[16px] font-bold text-gray-900 flex-1">Your Wishlist</h1>
          {items.length > 0 && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center pt-24">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                <Heart className="w-10 h-10 text-red-300 stroke-[1.5]" />
              </div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-[13px] text-gray-500 mb-8 max-w-[240px] mx-auto">
                Save your favourite products here and come back to them anytime.
              </p>
              <Link href="/" className="stitch-btn max-w-[200px] w-full justify-center min-h-[44px] mx-auto">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((product) => {
                const discountPct = product.mrp > product.price
                  ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                  : 0;
                return (
                  <div key={product.id} className="bg-white p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                    {/* Image */}
                    <Link href={`/product/${(product as any).slug || product.id}`} className="flex-shrink-0">
                      <div style={{
                        width: '80px', height: '80px', borderRadius: '12px',
                        background: product.image_url || 'var(--primary-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem',
                      }}>
                        {(!product.image_url || product.image_url.startsWith('linear')) &&
                          (CATEGORY_EMOJI[product.category_id] || '🛍️')}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${(product as any).slug || product.id}`} className="block">
                        <p className="text-[13px] font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</p>
                        <p className="text-[11px] text-gray-500 mb-2">{product.brand}</p>
                      </Link>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[15px] font-bold text-gray-900">₹{product.price}</span>
                        {product.mrp > product.price && (
                          <span className="text-[12px] text-gray-400 line-through">₹{product.mrp}</span>
                        )}
                        {discountPct > 0 && (
                          <span className="text-[11px] text-green-600 font-bold">{discountPct}% off</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { addItem(product, 1); removeItem(product.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                          style={{ backgroundColor: 'var(--primary)' }}
                        >
                          <ShoppingCart size={13} />
                          Move to Cart
                        </button>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
