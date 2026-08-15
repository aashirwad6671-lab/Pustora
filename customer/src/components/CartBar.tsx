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

  useEffect(() => {
    if (totalItems === 0) setExpanded(false);
    prevCountRef.current = totalItems;
  }, [totalItems]);

  if (totalItems === 0) return null;

  const firstName = items[0]?.product?.name ?? '';
  const extraCount = items.length - 1;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cb-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          z-index: 998;
        }
        .cb-wrapper {
          position: fixed;
          left: 0; right: 0;
          bottom: 64px;
          z-index: 999;
          padding: 0 10px 8px;
        }
        @media (min-width: 768px) {
          .cb-wrapper { bottom: 0; padding: 0 16px 12px; }
        }
        .cb-drawer {
          background: #fff;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -8px 32px rgba(0,0,0,0.18);
          border: 1px solid #ede9fe;
          border-bottom: none;
          max-height: 55vh;
          overflow-y: auto;
          padding: 12px 14px 4px;
        }
        .cb-bar {
          background: #1E1B4B;
          border-radius: 14px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 32px rgba(30,27,75,0.55);
          border: 1px solid rgba(99,91,255,0.35);
        }
        .cb-icon-btn {
          position: relative;
          background: #6C3FD6;
          border: none;
          border-radius: 10px;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
        }
        .cb-badge {
          position: absolute;
          top: -6px; right: -6px;
          background: #FBBF24;
          color: #111827;
          font-size: 10px; font-weight: 900;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #1E1B4B;
        }
        .cb-info {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }
        .cb-item-name {
          font-size: 12px;
          font-weight: 700;
          color: #FDE68A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
        .cb-meta {
          font-size: 10px;
          color: #a5b4fc;
          margin-top: 1px;
          white-space: nowrap;
        }
        .cb-cta {
          background: #10B981;
          color: #fff;
          font-weight: 800;
          font-size: 12px;
          padding: 9px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          line-height: 1;
        }
        .cb-cta:hover { background: #059669; }
        .cb-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 10px;
        }
        .cb-drawer-title { font-size: 13px; font-weight: 800; color: #1f2937; }
        .cb-drawer-close {
          background: #f3f4f6; border: none; border-radius: 8px;
          padding: 4px 8px; font-size: 11px; font-weight: 700;
          color: #6b7280; cursor: pointer;
        }
        .cb-item-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 4px; border-bottom: 1px solid #f9fafb;
        }
        .cb-item-thumb {
          position: relative; width: 44px; height: 52px;
          background: #f9fafb; border-radius: 8px; overflow: hidden;
          border: 1px solid #e5e7eb; flex-shrink: 0;
        }
        .cb-item-details { flex: 1; min-width: 0; }
        .cb-item-title {
          font-size: 11px; font-weight: 700; color: #111827;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cb-item-price { font-size: 11px; font-weight: 700; color: #6C3FD6; margin-top: 2px; }
        .cb-qty-controls {
          display: flex; align-items: center; gap: 4px;
          background: #f3f4f6; border-radius: 8px; padding: 4px; flex-shrink: 0;
        }
        .cb-qty-btn {
          width: 26px; height: 26px; background: #fff; border: 1px solid #e5e7eb;
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 14px; color: #374151; cursor: pointer; line-height: 1;
        }
        .cb-qty-num { width: 20px; text-align: center; font-size: 12px; font-weight: 700; color: #111827; }
        .cb-remove-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px; flex-shrink: 0; }
      `}} />

      {expanded && (
        <div className="cb-overlay" onClick={() => setExpanded(false)} />
      )}

      <div className="cb-wrapper">
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>

          {expanded && (
            <div className="cb-drawer">
              <div className="cb-drawer-head">
                <span className="cb-drawer-title">
                  Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
                <button className="cb-drawer-close" onClick={() => setExpanded(false)}>
                  Close X
                </button>
              </div>

              {items.map((item) => (
                <div key={item.product.id} className="cb-item-row">
                  <div className="cb-item-thumb">
                    <Image
                      src={item.product.image_url || '/placeholder-book.png'}
                      alt={item.product.name}
                      fill
                      style={{ objectFit: 'contain', padding: '4px' }}
                      unoptimized
                    />
                  </div>
                  <div className="cb-item-details">
                    <div className="cb-item-title">{item.product.name}</div>
                    <div className="cb-item-price">
                      Rs.{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      <span style={{ color: '#9ca3af', fontWeight: 500 }}> (x{item.quantity})</span>
                    </div>
                  </div>
                  <div className="cb-qty-controls">
                    <button className="cb-qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span className="cb-qty-num">{item.quantity}</span>
                    <button className="cb-qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="cb-remove-btn" onClick={() => removeItem(item.product.id)} title="Remove">X</button>
                </div>
              ))}
              <div style={{ height: '8px' }} />
            </div>
          )}

          <div className="cb-bar">
            <button className="cb-icon-btn" onClick={() => setExpanded(!expanded)} aria-label="Toggle cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" style={{ width: 20, height: 20 }} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="cb-badge">{totalItems}</span>
            </button>

            <div className="cb-info" onClick={() => setExpanded(!expanded)}>
              <div className="cb-item-name">
                {firstName}{extraCount > 0 ? ` +${extraCount} more` : ''}
              </div>
              <div className="cb-meta">
                {expanded ? 'Tap to hide' : 'Tap to view'} · Rs.{totalPrice.toLocaleString('en-IN')}
              </div>
            </div>

            <Link href="/cart" className="cb-cta">
              Checkout
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 13, height: 13 }} strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
