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
      {/* Expanded Mini-Cart Modal Overlay */}
      {expanded && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[998] transition-opacity"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sticky Bottom Cart Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[999] p-3 md:p-4 transition-all duration-300 transform translate-y-0"
        style={{ pointerEvents: 'none' }}
      >
        <div className="max-w-4xl mx-auto relative" style={{ pointerEvents: 'auto' }}>

          {/* Expandable Items List Drawer */}
          {expanded && (
            <div className="mb-3 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 max-h-[380px] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
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
          <div className="bg-[#1E1B4B] text-white rounded-2xl p-3 md:p-4 shadow-2xl flex items-center justify-between gap-3 border border-indigo-900/50 backdrop-blur-md">
            
            {/* Left: Cart Info & Item Drawer Toggle */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setExpanded(!expanded)}
                className="relative bg-[#6C3FD6] hover:bg-[#5b32be] text-white p-2.5 rounded-xl flex items-center justify-center transition-transform active:scale-95 shrink-0 shadow-md"
                aria-label="Toggle cart items"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1E1B4B]">
                  {totalItems}
                </span>
              </button>

              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
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
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">Subtotal</div>
                <div className="text-base md:text-lg font-black text-white">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <Link
                href="/cart"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>View Cart (₹{totalPrice.toLocaleString('en-IN')})</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth={2.5}>
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
