'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../store/cartStore';

export default function CartBar() {
  const { items, updateQuantity, removeItem, getItemsTotal } = useCartStore();
  const [expanded, setExpanded] = useState(false);
  const prevCountRef = useRef(0);

  const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalPrice = getItemsTotal();

  // Auto close popover if cart becomes empty
  useEffect(() => {
    if (totalItems === 0) {
      setExpanded(false);
    }
    prevCountRef.current = totalItems;
  }, [totalItems]);

  if (totalItems === 0) return null;

  // Build summary text for items
  let summaryText = '';
  if (items.length === 1) {
    summaryText = `${items[0].product.name} (×${items[0].quantity})`;
  } else if (items.length === 2) {
    summaryText = `${items[0].product.name} + ${items[1].product.name}`;
  } else if (items.length > 2) {
    summaryText = `${items[0].product.name} + ${items.length - 1} more items`;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .cart-bar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 998;
        }
        .cart-bar-wrapper {
          position: fixed; left: 0; right: 0; z-index: 999; padding: 12px; transition: all 0.3s ease;
          bottom: 64px; /* Default for mobile (above bottom nav) */
        }
        @media (min-width: 768px) {
          .cart-bar-wrapper {
            bottom: 0; padding: 16px;
          }
        }
        .cart-bar-drawer {
          background: white; border-radius: 16px; padding: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          border: 1px solid #f3f4f6; max-height: 380px; overflow-y: auto; margin-bottom: 12px;
        }
        .cart-bar-main {
          background-color: #1E1B4B; color: white; border-radius: 16px; padding: 12px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: space-between;
          gap: 12px; border: 1px solid rgba(49,46,129,0.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        @media (min-width: 768px) { .cart-bar-main { padding: 16px; } }
        .cart-bar-toggle {
          position: relative; background-color: #6C3FD6; color: white; padding: 10px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: none; cursor: pointer;
        }
        .cart-bar-badge {
          position: absolute; top: -6px; right: -6px; background-color: #FBBF24; color: #030712; font-size: 10px;
          font-weight: 900; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; border: 2px solid #1E1B4B;
        }
        .cart-bar-cta {
          background-color: #10B981; color: white; font-weight: bold; font-size: 14px; padding: 10px 16px;
          border-radius: 12px; display: flex; align-items: center; gap: 6px; text-decoration: none; cursor: pointer;
        }
        .cart-bar-cta:hover { background-color: #059669; }
      `}} />

      {/* Expanded Mini-Cart Modal Overlay */}
      {expanded && (
        <div 
          className="cart-bar-overlay"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sticky Bottom Cart Bar */}
      <div 
        className="cart-bar-wrapper"
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ maxWidth: '896px', margin: '0 auto', position: 'relative', pointerEvents: 'auto' }}>

          {/* Expandable Items List Drawer */}
          {expanded && (
            <div className="cart-bar-drawer">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6', marginBottom: '12px' }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-base">Your Basket Items</span>
                  <span className="bg-[#6C3FD6]/10 text-[#6C3FD6] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close ✕
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.product.id} 
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-purple-50/50 transition-colors border border-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                        <Image
                          src={item.product.image_url || '/placeholder-book.png'}
                          alt={item.product.name}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.product.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-[#6C3FD6] text-xs">₹{item.product.price}</span>
                          <span className="text-gray-400 text-xs">× {item.quantity}</span>
                          <span className="text-gray-500 font-semibold text-xs ml-auto">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 shrink-0 bg-gray-100 rounded-lg p-1 border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center font-bold text-gray-700 bg-white rounded shadow-xs hover:bg-gray-50 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-semibold text-xs text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center font-bold text-gray-700 bg-white rounded shadow-xs hover:bg-gray-50 transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="ml-1 text-red-500 hover:text-red-700 p-1 text-xs font-bold"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Bottom Floating Bar */}
          <div className="cart-bar-main">
            
            {/* Left: Cart Info & Item Drawer Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
              <button
                onClick={() => setExpanded(!expanded)}
                className="cart-bar-toggle"
                aria-label="Toggle cart items"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '20px', height: '20px' }} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="cart-bar-badge">
                  {totalItems}
                </span>
              </button>

              <div style={{ minWidth: 0, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs md:text-sm text-amber-300 truncate">
                    {summaryText}
                  </span>
                  <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                    {expanded ? 'Hide Items ▲' : 'View Items ▼'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-300 font-medium truncate mt-0.5">
                  {items.length} {items.length === 1 ? 'distinct title' : 'distinct titles'} added
                </div>
              </div>
            </div>

            {/* Right: Total Price & Checkout CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }} className="hidden sm:block">
                <div style={{ fontSize: '10px', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Subtotal</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>
                  ₹{totalPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <Link
                href="/cart"
                className="cart-bar-cta"
              >
                <span>View Cart (₹{totalPrice.toLocaleString('en-IN')})</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '16px', height: '16px' }} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
