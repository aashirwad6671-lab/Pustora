'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { OrderService } from '../../services/orderService';
import { supabase } from '../../services/supabaseClient';
import type { OrderStatus } from '../../types';

const ORDER_STATUS_STEP: Record<OrderStatus, number> = {
  placed: 0,
  confirmed: 1,
  packed: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: 0,
};

export default function CartPage() {
  const router = useRouter();
  
  const { user, isAuthenticated } = useAuthStore();
  const {
    items,
    removeItem,
    updateQuantity,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    deliveryCalculations,
    calculateDelivery,
    getItemsTotal,
    getDiscountTotal,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const { nearestStore, distanceKm, fetchStores } = useLocationStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  
  // Design stages: 'cart' | 'checkout' | 'tracking'
  const [stage, setStage] = useState<'cart' | 'checkout' | 'tracking'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'CARD' | 'WALLET'>('UPI');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Active address choice
  const [selectedAddressLabel, setSelectedAddressLabel] = useState('Home');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Tracking animated progress indicator - driven by real Supabase order status
  const [trackingStep, setTrackingStep] = useState(0);
  const [liveOrderStatus, setLiveOrderStatus] = useState<string>('placed');
  const trackingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Fetch real stores from DB (so we get actual UUIDs for order creation)
    fetchStores();

    // Automatically trigger delivery cost calculation using location coords
    const lat = 26.8504;
    const lng = 80.9419;
    calculateDelivery(lat, lng);

    // Fetch user addresses
    if (user?.id) {
      supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).then(({ data, error }) => {
        if (!error && data) {
          setAddresses(data);
          if (data.length > 0) setSelectedAddressId(data[0].id);
        }
      });
    }
  }, [user?.id]);

  // Subscribe to real-time order status from Supabase when tracking stage begins
  useEffect(() => {
    if (stage === 'tracking' && placedOrderId && !placedOrderId.startsWith('order-lucknow-')) {
      // Fetch current status immediately
      supabase
        .from('orders')
        .select('status')
        .eq('id', placedOrderId)
        .single()
        .then(({ data }) => {
          if (data?.status) {
            const step = ORDER_STATUS_STEP[data.status as OrderStatus] ?? 0;
            setTrackingStep(step);
            setLiveOrderStatus(data.status);
          }
        });

      // Subscribe to real-time changes on this order
      const channel = supabase
        .channel(`order-tracking-${placedOrderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${placedOrderId}`,
          },
          (payload: any) => {
            const newStatus = payload.new?.status as OrderStatus;
            if (newStatus) {
              const step = ORDER_STATUS_STEP[newStatus] ?? 0;
              setTrackingStep(step);
              setLiveOrderStatus(newStatus);
            }
          }
        )
        .subscribe();

      trackingChannelRef.current = channel;

      return () => {
        channel.unsubscribe();
        trackingChannelRef.current = null;
      };
    }
  }, [stage, placedOrderId]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    if (!couponCode) return;

    const success = await applyCoupon(couponCode);
    if (success) {
      setCouponSuccess('Coupon applied successfully! Discount updated.');
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code or minimum order value eligibility not met.');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess(null);
    setCouponError(null);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setStage('checkout');
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login?redirect=/cart');
      return;
    }
    
    if (addresses.length === 0 || !selectedAddressId) {
      alert('Please add or select a delivery address');
      return;
    }

    setCheckoutLoading(true);
    try {
      const userId = user?.id || 'demo-user-uuid-12345';
      // Use the real UUID from deliveryCalculations (fetched from DB), or nearestStore from locationStore
      const storeId = deliveryCalculations?.nearestStoreId || nearestStore?.id || null;

      if (!storeId) {
        alert('Unable to determine nearest store. Please try again.');
        setCheckoutLoading(false);
        return;
      }
      const address = 'Hazratganj, Lucknow';
      const lat = 26.8504;
      const lng = 80.9419;

      const itemsTotal = getItemsTotal();
      const deliveryFee = deliveryCalculations ? deliveryCalculations.deliveryFee : 0;
      const discount = getDiscountTotal();
      const grandTotal = getGrandTotal();

      // UUID validation regex
      const isValidUUID = (str: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // Resolve product IDs - if cart has legacy fake IDs, look up real UUID from Supabase by name
      const checkoutItems = await Promise.all(
        items.map(async (it) => {
          let productId = it.product.id;
          if (!isValidUUID(productId)) {
            const { data: prodData } = await supabase
              .from('products')
              .select('id')
              .eq('name', it.product.name)
              .single();
            if (prodData?.id) {
              productId = prodData.id;
            } else {
              throw new Error(`Product "${it.product.name}" not found in database. Please clear cart and re-add items.`);
            }
          }
          return {
            productId,
            quantity: it.quantity,
            price: it.product.price,
          };
        })
      );

      const response = await OrderService.createOrder(
        userId,
        storeId,
        selectedAddressId,
        address,
        lat,
        lng,
        distanceKm || 1.2,
        itemsTotal,
        deliveryFee,
        discount,
        grandTotal,
        paymentMethod === 'WALLET' ? 'CARD' : paymentMethod,
        checkoutItems
      );

      if (response.error) {
        alert('Failed to place order: ' + response.error);
      } else if (response.data) {
        setPlacedOrderId(response.data.id);
        setStage('tracking');
        clearCart();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--deep-text)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--outline)' }}>
        <Link href="/" className="text-xl font-black tracking-wider stitch-logo" style={{ color: 'var(--primary)', fontFamily: 'Sora, sans-serif' }}>
          PUSTORA
        </Link>
        <div className="flex gap-2 text-xs font-bold text-gray-500">
          <span style={{ color: stage === 'cart' ? 'var(--primary)' : 'inherit' }}>Basket</span> • 
          <span style={{ color: stage === 'checkout' ? 'var(--primary)' : 'inherit' }}>Checkout</span> • 
          <span style={{ color: stage === 'tracking' ? 'var(--primary)' : 'inherit' }}>Tracking</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        
        {/* --- STAGE 1: CART VIEW --- */}
        {stage === 'cart' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold mb-6 tracking-tight flex items-center gap-2" style={{ color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif' }}>
              🛒 Your Shopping Basket
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-20 stitch-card rounded-2xl max-w-lg mx-auto" style={{ borderStyle: 'dashed' }}>
                <span className="text-6xl mb-4 block">🎒</span>
                <p className="text-gray-500 mb-6 font-semibold">Your basket is empty. Add textbooks or school uniform packs to continue.</p>
                <Link href="/" className="stitch-btn inline-block">
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items List */}
                <div className="md:col-span-2 space-y-4">
                  <div className="stitch-card space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 items-center border-b pb-4 last:border-none last:pb-0"
                        style={{ borderColor: 'var(--outline)' }}
                        id={`cart-item-${item.product.id}`}
                      >
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center border text-2xl shrink-0" style={{ backgroundColor: 'var(--tint-chip)', borderColor: 'var(--outline)' }}>
                          {item.product.category_id === 'books' ? '📚' : item.product.category_id === 'stationery' ? '✏️' : '🎁'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate" style={{ color: 'var(--deep-text)' }}>{item.product.name}</h4>
                          <p className="text-xs font-bold text-gray-500">{item.product.brand}</p>
                          <span className="text-xs text-gray-500 block mt-0.5">₹{item.product.price} each</span>
                        </div>

                        {/* Stepper qty controls */}
                        <div className="flex items-center rounded-xl px-1 py-1 border bg-white" style={{ borderColor: 'var(--outline)' }}>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="text-gray-500 hover:text-black px-2 py-0.5 font-bold text-sm min-h-[32px]"
                            style={{ cursor: 'pointer' }}
                            id={`btn-dec-${item.product.id}`}
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="text-gray-500 hover:text-black px-2 py-0.5 font-bold text-sm min-h-[32px]"
                            style={{ cursor: 'pointer' }}
                            id={`btn-inc-${item.product.id}`}
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-sm block">₹{item.product.price * item.quantity}</span>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-[10px] hover:underline block mt-0.5"
                            style={{ color: 'var(--error)', cursor: 'pointer' }}
                            id={`btn-del-${item.product.id}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Input */}
                  <div className="stitch-card">
                    <h4 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--primary)' }}>
                      🏷️ Apply Promo Coupon
                    </h4>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between border p-3 rounded-xl bg-white" style={{ borderColor: 'var(--primary)' }}>
                        <div>
                          <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{appliedCoupon.code}</span>
                          <p className="text-xs text-gray-500">Save ₹{appliedCoupon.discount_amount} on order</p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-xs font-bold min-h-[44px]"
                          style={{ color: 'var(--error)', cursor: 'pointer' }}
                          id="btn-remove-coupon"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter promo coupon code (e.g. PU50)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="stitch-input"
                          id="input-coupon"
                        />
                        <button
                          type="submit"
                          className="stitch-btn-secondary text-xs font-bold"
                          id="btn-apply-coupon"
                        >
                          Apply
                        </button>
                      </form>
                    )}

                    {couponError && <p className="text-[10px] text-red-500 mt-2 font-medium">{couponError}</p>}
                    {couponSuccess && <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--success)' }}>{couponSuccess}</p>}
                  </div>
                </div>

                {/* Bill Pricing Panel */}
                <div className="space-y-4">
                  <div className="stitch-card space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Price Details</h3>

                    <div className="space-y-2 text-xs border-b pb-4 font-semibold" style={{ borderColor: 'var(--outline)' }}>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Items Subtotal</span>
                        <span>₹{getItemsTotal()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Fee</span>
                        <span>₹{deliveryCalculations ? deliveryCalculations.deliveryFee : 0}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between" style={{ color: 'var(--success)' }}>
                          <span>Coupon Discount</span>
                          <span>-₹{getDiscountTotal()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Total Amount</span>
                      <span className="text-lg font-black" style={{ color: 'var(--primary)' }}>₹{getGrandTotal()}</span>
                    </div>

                    <button
                      onClick={handleProceedToCheckout}
                      className="stitch-btn w-full justify-center min-h-[48px]"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- STAGE 2: CHECKOUT VIEW --- */}
        {stage === 'checkout' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold mb-6 tracking-tight" style={{ color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif' }}>
              📋 Complete Checkout Order
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="stitch-card space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--primary)' }}>
                      📍 Delivery Address selector
                    </h4>
                    {addresses.length > 0 && (
                      <Link href="/addresses/new" className="text-[10px] font-bold underline" style={{ color: 'var(--primary)' }}>+ Add New</Link>
                    )}
                  </div>
                  {addresses.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed rounded-xl space-y-3" style={{ borderColor: 'var(--outline)' }}>
                      <p className="text-xs text-gray-500 font-medium">No saved addresses found.</p>
                      <Link href="/addresses/new" className="stitch-btn text-xs px-4 py-2 inline-flex items-center gap-2 min-h-[40px]">
                        Add Delivery Address
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedAddressId === addr.id ? 'border-[#2874f0] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                checked={selectedAddressId === addr.id} 
                                readOnly 
                                className="w-4 h-4 text-[#2874f0] border-gray-300 focus:ring-[#2874f0]" 
                              />
                              <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                {addr.label || 'Home'}
                              </span>
                              {addr.is_default && (
                                <span className="text-[#2874f0] text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-6 space-y-1">
                            <p className="text-sm font-bold text-gray-800">{user?.full_name || 'Customer'}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {addr.address_line1}
                              {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                              <br />
                              {addr.area}, {addr.city}, {addr.state} - <span className="font-semibold text-black">{addr.pincode}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery ETA banner */}
                <div className="stitch-card" style={{ backgroundColor: 'var(--accent)', border: 'none' }}>
                  <div className="flex items-center gap-3 text-white">
                    <span className="text-3xl">⏱️</span>
                    <div>
                      <span className="text-xs font-bold block text-white/95">Estimated Time of Dispatch</span>
                      <p className="text-sm font-black text-white">Delivery ETA: 1 - 2 Days max!</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method selectors */}
                <div className="stitch-card space-y-4">
                  <h4 className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--primary)' }}>
                    💳 Select Payment Method
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['UPI', 'COD', 'CARD', 'WALLET'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPaymentMethod(mode)}
                        className={`stitch-btn-secondary text-xs min-h-[44px] justify-center ${
                          paymentMethod === mode ? 'stitch-chip-active' : ''
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checkout CTA */}
              <div className="space-y-4">
                <div className="stitch-card space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Checkout Summary</h3>
                  <div className="space-y-2 text-xs border-b pb-4 font-semibold" style={{ borderColor: 'var(--outline)' }}>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>₹{getItemsTotal()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping Partner</span>
                      <span>₹{deliveryCalculations ? deliveryCalculations.deliveryFee : 0}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between" style={{ color: 'var(--success)' }}>
                        <span>Coupon Savings</span>
                        <span>-₹{getDiscountTotal()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold">Total Amount</span>
                    <span className="text-lg font-black" style={{ color: 'var(--primary)' }}>₹{getGrandTotal()}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="stitch-btn w-full justify-center min-h-[48px]"
                  >
                    {checkoutLoading ? 'Processing Checkout...' : 'Place Order Now'}
                  </button>

                  <button
                    onClick={() => setStage('cart')}
                    className="stitch-btn-secondary w-full justify-center min-h-[44px]"
                  >
                    Back to Basket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STAGE 3: ORDER TRACKING PROGRESS VIEW --- */}
        {stage === 'tracking' && (
          <div className="space-y-6">
            <div className="stitch-card text-center max-w-xl mx-auto p-8 space-y-6">
              <span className="text-6xl block">🎉</span>
              <h3 className="text-2xl font-black text-green-600" style={{ fontFamily: 'Sora, sans-serif' }}>Order Placed Successfully!</h3>
              
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block font-bold">Order ID Reference</span>
                <span className="text-sm font-black bg-purple-50 px-3 py-1 rounded-lg border" style={{ color: 'var(--primary)', borderColor: 'var(--outline)' }}>
                  {placedOrderId}
                </span>
              </div>

              {/* Animated Milestone Step Timeline */}
              <div className="border-t border-b py-6 space-y-4" style={{ borderColor: 'var(--outline)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Real-time Dispatch Status</span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-purple-50" style={{ color: 'var(--primary)' }}>
                    {liveOrderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center relative px-2">
                  {/* Progress Line */}
                  <div className="absolute left-0 right-0 h-1 bg-gray-200 z-0 top-1/2 -translate-y-1/2" />
                  <div className="absolute left-0 h-1 bg-purple-600 z-0 top-1/2 -translate-y-1/2 transition-all duration-500" style={{ width: `${(trackingStep / 4) * 100}%` }} />

                  {/* Steps */}
                  {['Placed', 'Confirmed', 'Packed', 'On Way', 'Delivered'].map((step, idx) => (
                    <div key={step} className="flex flex-col items-center z-10">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                          trackingStep >= idx ? 'bg-purple-600 text-white border-purple-600 scale-110' : 'bg-white text-gray-500 border-gray-300'
                        }`}
                      >
                        {trackingStep > idx ? '✓' : idx + 1}
                      </span>
                      <span className="text-[9px] font-bold mt-2" style={{ color: trackingStep >= idx ? 'var(--deep-text)' : '#8C84A9' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GPS Map removed as requested */}

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left space-y-1 text-xs">
                <span className="font-bold text-amber-800">⏱️ Lucknow Delivery ETA Target</span>
                <p className="text-amber-700">Books are being packaged from the **{nearestStore ? nearestStore.name : 'Hazratganj Main Depot'}**. Estimated Arrival in 1-2 Days.</p>
              </div>

              <Link href="/" className="stitch-btn w-full justify-center">
                Return to Bookstore Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
