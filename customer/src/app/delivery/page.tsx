'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DeliveryPartnerService,
  DeliveryPartnerProfile,
  AssignedOrder,
} from '../../services/deliveryPartnerService';
import { supabase } from '../../services/supabaseClient';

// ─── Helpers ─────────────────────────────────────────────────
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const VEHICLE_OPTIONS = [
  { id: 'Motorcycle', label: '🏍️ Motorcycle / Bike' },
  { id: 'Scooter', label: '🛵 Scooter' },
  { id: 'Electric Scooter', label: '⚡ Electric Scooter' },
  { id: 'Bicycle', label: '🚲 Bicycle' },
  { id: 'Van', label: '🚐 Delivery Van' },
];

// ─── Sub-components ───────────────────────────────────────────
function OrderCard({
  order,
  partnerId,
  onDelivered,
}: {
  order: AssignedOrder;
  partnerId: string;
  onDelivered: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const isCOD = order.payment_method === 'COD';

  const address = order.addresses;
  const fullAddress = address
    ? [address.address_line1, address.address_line2, address.area, address.city, address.pincode]
        .filter(Boolean)
        .join(', ')
    : order.delivery_address || 'Address not available';

  async function handleMarkDelivered() {
    if (!confirm(`Mark this order as delivered for ${order.profiles?.full_name || 'customer'}?`)) return;
    setLoading(true);
    const res = await DeliveryPartnerService.markAsDelivered(order.id, partnerId);
    setLoading(false);
    if (res.error) {
      alert(`Error: ${res.error}`);
    } else {
      setConfirmed(true);
      setTimeout(() => onDelivered(order.id), 800);
    }
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #E8E4F0',
      boxShadow: '0 2px 12px rgba(88, 28, 190, 0.07)',
      overflow: 'hidden',
      transition: 'opacity 0.4s',
      opacity: confirmed ? 0 : 1,
    }}>
      {/* Card Header */}
      <div style={{
        background: 'linear-gradient(135deg, #581C87 0%, #7C3AED 100%)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', fontFamily: 'Sora, sans-serif' }}>
            {order.profiles?.full_name || 'Customer'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '2px' }}>
            📞 <a href={`tel:${order.profiles?.phone_number}`} style={{ color: '#FCD34D', fontWeight: 600 }}>{order.profiles?.phone_number || '—'}</a> · {timeAgo(order.created_at)}
          </div>
        </div>
        <div>
          {isCOD ? (
            <span style={{
              background: '#FEF9C3',
              color: '#713F12',
              border: '1px solid #FDE047',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              💵 COD — Collect ₹{order.grand_total}
            </span>
          ) : (
            <span style={{
              background: '#D1FAE5',
              color: '#065F46',
              border: '1px solid #6EE7B7',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              ✅ PAID — {order.payment_method}
            </span>
          )}
        </div>
      </div>

      {/* Address */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3EEF9', background: '#FDFAFF' }}>
        <div style={{ fontSize: '11px', color: '#9333EA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          📍 Deliver To
        </div>
        <div style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.5' }}>
          {fullAddress}
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3EEF9' }}>
        <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          📦 Order Items ({order.order_items?.length || 0})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {order.order_items?.map((item, i) => (
            <div key={item.id || i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              background: '#F9F7FF',
              borderRadius: '8px',
              border: '1px solid #EDE9FE',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                  {item.products?.name || 'Item'}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                  {item.products?.brand || ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>
                  ₹{item.price_at_purchase}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  Qty: {item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Row */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid #F3EEF9', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>Items: <strong style={{ color: '#374151' }}>₹{order.items_total}</strong></div>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>Delivery: <strong style={{ color: '#374151' }}>₹{order.delivery_fee}</strong></div>
        {order.discount_applied > 0 && (
          <div style={{ fontSize: '12px', color: '#10B981' }}>Discount: <strong>-₹{order.discount_applied}</strong></div>
        )}
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', marginLeft: 'auto' }}>
          Total: ₹{order.grand_total}
        </div>
      </div>

      {/* Action */}
      <div style={{ padding: '14px 18px' }}>
        <button
          onClick={handleMarkDelivered}
          disabled={loading || confirmed}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '10px',
            border: 'none',
            background: confirmed ? '#D1FAE5' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: confirmed ? '#065F46' : '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading || confirmed ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {loading ? '⏳ Updating...' : confirmed ? '✅ Delivered!' : '✅ Mark as Delivered'}
        </button>
      </div>
    </div>
  );
}

function DeliveredHistoryCard({ order }: { order: AssignedOrder }) {
  return (
    <div style={{
      background: '#F0FDF4',
      borderRadius: '12px',
      border: '1px solid #BBF7D0',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>✅</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#065F46' }}>
          {order.profiles?.full_name || 'Customer'}
        </div>
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
          {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''} · {formatTime(order.updated_at)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>₹{order.grand_total}</div>
        <div style={{ fontSize: '10px', color: '#6B7280' }}>{order.payment_method}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DeliveryPortalPage() {
  // Auth Modes: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sign In Form States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [useDropdownLogin, setUseDropdownLogin] = useState(true);

  // Sign Up Form States
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupVehicleType, setSignupVehicleType] = useState('Motorcycle');
  const [signupVehicleNumber, setSignupVehicleNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('');
  const [editVehicleNumber, setEditVehicleNumber] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // App / Partner Data
  const [allPartners, setAllPartners] = useState<DeliveryPartnerProfile[]>([]);
  const [partner, setPartner] = useState<DeliveryPartnerProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Orders State
  const [activeOrders, setActiveOrders] = useState<AssignedOrder[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<AssignedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'profile'>('active');

  // ── Load orders whenever partner logs in ──
  const loadOrders = useCallback(async (partnerId: string) => {
    setOrdersLoading(true);
    const [activeRes, historyRes] = await Promise.all([
      DeliveryPartnerService.getMyAssignedOrders(partnerId),
      DeliveryPartnerService.getDeliveredToday(partnerId),
    ]);
    if (activeRes.data) setActiveOrders(activeRes.data);
    if (historyRes.data) setDeliveredOrders(historyRes.data);
    setOrdersLoading(false);
  }, []);

  // ── Fetch all delivery partners on mount & restore session ──
  useEffect(() => {
    async function init() {
      setPartnersLoading(true);
      const res = await DeliveryPartnerService.getAllDeliveryPartners();
      if (res.data) {
        setAllPartners(res.data);
        if (res.data.length > 0) {
          setSelectedPartnerId(res.data[0].partnerId);
        }
      }
      setPartnersLoading(false);

      // Check localStorage for saved session
      try {
        const saved = localStorage.getItem('pustora_delivery_partner');
        if (saved) {
          const parsed = JSON.parse(saved) as DeliveryPartnerProfile;
          if (parsed && parsed.partnerId) {
            setPartner(parsed);
            setEditName(parsed.fullName || '');
            setEditVehicleType(parsed.vehicleType || 'Motorcycle');
            setEditVehicleNumber(parsed.vehicleNumber || '');
            setIsAuthenticated(true);
            loadOrders(parsed.partnerId);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    init();
  }, [loadOrders]);

  // ── Realtime: watch for new orders assigned to this partner ──
  useEffect(() => {
    if (!partner) return;

    const channel = supabase
      .channel(`delivery-partner-${partner.partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `delivery_partner_id=eq.${partner.partnerId}`,
        },
        () => {
          loadOrders(partner.partnerId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `delivery_partner_id=eq.${partner.partnerId}`,
        },
        () => {
          loadOrders(partner.partnerId);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [partner, loadOrders]);

  // ── Handlers ──
  async function handleDropdownLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    if (loginPassword !== 'admin@12345') {
      setAuthError('Incorrect password. Enter valid admin password (admin@12345).');
      return;
    }

    setAuthLoading(true);
    let partnerProfile = allPartners.find(p => p.partnerId === selectedPartnerId);

    if (!partnerProfile && allPartners.length === 0) {
      partnerProfile = {
        partnerId: 'default-partner',
        profileId: 'default-profile',
        fullName: 'Primary Delivery Partner',
        phoneNumber: '+919999999999',
        vehicleType: 'Motorcycle',
        vehicleNumber: 'UP32 AB 1234',
        status: 'active',
      };
    }

    if (partnerProfile) {
      setPartner(partnerProfile);
      setEditName(partnerProfile.fullName || '');
      setEditVehicleType(partnerProfile.vehicleType || 'Motorcycle');
      setEditVehicleNumber(partnerProfile.vehicleNumber || '');
      setIsAuthenticated(true);
      try {
        localStorage.setItem('pustora_delivery_partner', JSON.stringify(partnerProfile));
      } catch (err) {
        // ignore
      }
      loadOrders(partnerProfile.partnerId);
    } else {
      setAuthError('Please select a valid partner profile.');
    }
    setAuthLoading(false);
  }

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const res = await DeliveryPartnerService.loginByPhoneAndPassword(loginPhone, loginPassword);
    setAuthLoading(false);

    if (res.error || !res.data) {
      setAuthError(res.error || 'Login failed.');
    } else {
      setPartner(res.data);
      setEditName(res.data.fullName || '');
      setEditVehicleType(res.data.vehicleType || 'Motorcycle');
      setEditVehicleNumber(res.data.vehicleNumber || '');
      setIsAuthenticated(true);
      try {
        localStorage.setItem('pustora_delivery_partner', JSON.stringify(res.data));
      } catch (err) {
        // ignore
      }
      loadOrders(res.data.partnerId);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!signupName.trim() || !signupPhone.trim() || !signupVehicleNumber.trim()) {
      setAuthError('Please fill in your name, mobile number, and vehicle registration number.');
      return;
    }

    if (signupPassword !== 'admin@12345') {
      setAuthError('Registration password must be admin@12345');
      return;
    }

    setAuthLoading(true);
    const res = await DeliveryPartnerService.registerDeliveryPartner({
      fullName: signupName.trim(),
      phoneNumber: signupPhone.trim(),
      vehicleType: signupVehicleType,
      vehicleNumber: signupVehicleNumber.trim(),
      password: signupPassword,
    });
    setAuthLoading(false);

    if (res.error || !res.data) {
      setAuthError(res.error || 'Registration failed.');
    } else {
      setPartner(res.data);
      setEditName(res.data.fullName || '');
      setEditVehicleType(res.data.vehicleType || 'Motorcycle');
      setEditVehicleNumber(res.data.vehicleNumber || '');
      setIsAuthenticated(true);
      try {
        localStorage.setItem('pustora_delivery_partner', JSON.stringify(res.data));
      } catch (err) {
        // ignore
      }
      // Refresh partner list
      DeliveryPartnerService.getAllDeliveryPartners().then(pRes => {
        if (pRes.data) setAllPartners(pRes.data);
      });
      loadOrders(res.data.partnerId);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!partner) return;
    setProfileSaving(true);

    const res = await DeliveryPartnerService.updateProfile(partner.partnerId, partner.profileId, {
      fullName: editName,
      vehicleType: editVehicleType,
      vehicleNumber: editVehicleNumber,
    });
    setProfileSaving(false);

    if (res.error) {
      alert(`Update failed: ${res.error}`);
    } else {
      const updated: DeliveryPartnerProfile = {
        ...partner,
        fullName: editName,
        vehicleType: editVehicleType,
        vehicleNumber: editVehicleNumber.toUpperCase(),
      };
      setPartner(updated);
      setIsEditingProfile(false);
      try {
        localStorage.setItem('pustora_delivery_partner', JSON.stringify(updated));
      } catch (err) {
        // ignore
      }
      alert('Profile details updated successfully!');
    }
  }

  function handleOrderDelivered(orderId: string) {
    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (partner) {
      DeliveryPartnerService.getDeliveredToday(partner.partnerId).then((res) => {
        if (res.data) setDeliveredOrders(res.data);
      });
    }
  }

  async function handleSignOut() {
    try {
      localStorage.removeItem('pustora_delivery_partner');
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
    setPartner(null);
    setActiveOrders([]);
    setDeliveredOrders([]);
    setLoginPassword('');
    setSignupPassword('');
  }

  async function handleToggleStatus() {
    if (!partner) return;
    const newStatus = partner.status === 'active' ? 'offline' : 'active';
    await DeliveryPartnerService.updateMyStatus(partner.partnerId, newStatus);
    setPartner((prev) => prev ? { ...prev, status: newStatus } : prev);
  }

  // ─── RENDER ───────────────────────────────────────────────────

  // Authentication Screen (Sign In & Sign Up)
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #160226 0%, #2E0854 45%, #6D28D9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: '"DM Sans", -apple-system, sans-serif',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          padding: '36px 28px',
        }}>
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 12px',
              boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
            }}>
              🚴
            </div>
            <h1 style={{
              color: '#fff',
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 0 4px 0',
              fontFamily: 'Sora, sans-serif',
            }}>
              Pustora Delivery Fleet
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0 }}>
              Partner Dispatch & Delivery Portal
            </p>
          </div>

          {/* Auth Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '22px',
          }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'login' ? 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)' : 'transparent',
                color: authMode === 'login' ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setAuthError(null); }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'signup' ? 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)' : 'transparent',
                color: authMode === 'signup' ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              + Create Account
            </button>
          </div>

          {/* ── SIGN IN FORM ── */}
          {authMode === 'login' && (
            <form onSubmit={useDropdownLogin ? handleDropdownLogin : handlePhoneLogin}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {useDropdownLogin ? 'Select Partner Profile' : 'Mobile Number'}
                </label>
                <button
                  type="button"
                  onClick={() => setUseDropdownLogin(!useDropdownLogin)}
                  style={{ color: '#C4B5FD', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {useDropdownLogin ? 'Switch to Phone Number' : 'Switch to Partner List'}
                </button>
              </div>

              {useDropdownLogin ? (
                <div style={{ marginBottom: '16px' }}>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: '#2B0E44',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {partnersLoading ? (
                      <option value="">Loading delivery partners...</option>
                    ) : allPartners.length === 0 ? (
                      <option value="">No partners yet — Sign Up below!</option>
                    ) : (
                      allPartners.map((dp) => (
                        <option key={dp.partnerId} value={dp.partnerId}>
                          {dp.fullName || 'Partner'} ({dp.vehicleType}{dp.vehicleNumber ? ` - ${dp.vehicleNumber}` : ''})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <input
                    type="tel"
                    required
                    placeholder="+91XXXXXXXXXX"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Portal Password
                </label>
                <input
                  type="password"
                  required
                  placeholder=""
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {authError && (
                <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#FCA5A5', fontSize: '13px', marginBottom: '16px' }}>
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  border: 'none',
                  background: authLoading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Sora, sans-serif',
                }}
              >
                {authLoading ? 'Verifying...' : 'Sign In to Portal →'}
              </button>
            </form>
          )}

          {/* ── SIGN UP FORM ── */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup}>
              {/* Full Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Mobile Number */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mobile Number (Format: +91XXXXXXXXXX)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Vehicle Type & Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={signupVehicleType}
                    onChange={(e) => setSignupVehicleType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: '#2B0E44',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {VEHICLE_OPTIONS.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="UP32 AB 1234"
                    value={signupVehicleNumber}
                    onChange={(e) => setSignupVehicleNumber(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Admin Authorization Password
                </label>
                <input
                  type="password"
                  required
                  placeholder=""
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {authError && (
                <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#FCA5A5', fontSize: '13px', marginBottom: '16px' }}>
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  border: 'none',
                  background: authLoading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Sora, sans-serif',
                }}
              >
                {authLoading ? 'Creating Profile...' : 'Complete Sign Up & Join Fleet 🚴'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─── DASHBOARD WORKSPACE ───
  const totalEarningsToday = deliveredOrders.reduce((s, o) => s + Number(o.grand_total), 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F3FF',
      fontFamily: '"DM Sans", -apple-system, sans-serif',
    }}>
      {/* ── Top Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #2E0854 0%, #6D28D9 100%)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(88,28,190,0.3)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🚴
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', fontFamily: 'Sora, sans-serif' }}>
                {partner?.fullName || 'Partner'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {partner?.vehicleType} · {partner?.vehicleNumber || 'No Plate'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status Toggle */}
            <button
              onClick={handleToggleStatus}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: partner?.status === 'active'
                  ? 'rgba(16,185,129,0.25)'
                  : partner?.status === 'busy'
                  ? 'rgba(245,158,11,0.25)'
                  : 'rgba(107,114,128,0.25)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: partner?.status === 'busy' ? 'not-allowed' : 'pointer',
              }}
              disabled={partner?.status === 'busy'}
            >
              {partner?.status === 'active' ? '🟢 Active' : partner?.status === 'busy' ? '🟡 On Delivery' : '⚫ Offline'}
            </button>
            <button
              onClick={handleSignOut}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '18px 16px 40px' }}>

        {/* ── Stats Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          {[
            { label: 'Active Queue', value: activeOrders.length, color: '#7C3AED', bg: '#EDE9FE' },
            { label: 'Delivered Today', value: deliveredOrders.length, color: '#059669', bg: '#D1FAE5' },
            { label: "Today's Volume", value: `₹${totalEarningsToday}`, color: '#D97706', bg: '#FEF3C7' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: '12px', padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color, fontFamily: 'Sora, sans-serif' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '10px', color: stat.color, fontWeight: 700, marginTop: '2px', opacity: 0.85 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab Bar (Active / History / Profile) ── */}
        <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: '12px', padding: '3px', marginBottom: '18px' }}>
          {(['active', 'history', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: '9px',
                border: 'none',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#7C3AED' : '#6B7280',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: activeTab === tab ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {tab === 'active' ? `🚴 Active (${activeOrders.length})` : tab === 'history' ? `✅ History (${deliveredOrders.length})` : '👤 My Profile'}
            </button>
          ))}
        </div>

        {/* ── TAB 1: ACTIVE DELIVERIES ── */}
        {activeTab === 'active' && (
          ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading active deliveries...</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #E8E4F0',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📦</div>
              <h3 style={{ color: '#374151', fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>
                No Active Deliveries Right Now
              </h3>
              <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                When the admin assigns an order to your profile, it will appear here automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  partnerId={partner!.partnerId}
                  onDelivered={handleOrderDelivered}
                />
              ))}
            </div>
          )
        )}

        {/* ── TAB 2: DELIVERED HISTORY ── */}
        {activeTab === 'history' && (
          deliveredOrders.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #E8E4F0',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📋</div>
              <h3 style={{ color: '#374151', fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>
                No Deliveries Completed Today
              </h3>
              <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                Orders you deliver today will be listed here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deliveredOrders.map((order) => (
                <DeliveredHistoryCard key={order.id} order={order} />
              ))}
            </div>
          )
        )}

        {/* ── TAB 3: PARTNER PROFILE & VEHICLE DETAILS ── */}
        {activeTab === 'profile' && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #E8E4F0',
            padding: '24px 20px',
            boxShadow: '0 2px 12px rgba(88, 28, 190, 0.05)',
          }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F3EEF9' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', color: '#fff',
              }}>
                {(partner?.fullName || 'P').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', fontFamily: 'Sora, sans-serif' }}>
                  {partner?.fullName}
                </div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✓ Verified Pustora Delivery Partner
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid #DDD6FE',
                  background: isEditingProfile ? '#EDE9FE' : '#F5F3FF',
                  color: '#7C3AED',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isEditingProfile ? '✕ Cancel' : '✏️ Edit'}
              </button>
            </div>

            {/* View Profile State */}
            {!isEditingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#F9F7FF', padding: '12px', borderRadius: '10px', border: '1px solid #EDE9FE' }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Registered Mobile</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginTop: '2px' }}>{partner?.phoneNumber}</div>
                  </div>
                  <div style={{ background: '#F9F7FF', padding: '12px', borderRadius: '10px', border: '1px solid #EDE9FE' }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Vehicle Type</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginTop: '2px' }}>{partner?.vehicleType}</div>
                  </div>
                </div>

                <div style={{ background: '#F9F7FF', padding: '14px', borderRadius: '10px', border: '1px solid #EDE9FE' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Vehicle Registration Plate</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#7C3AED', marginTop: '2px', letterSpacing: '1px' }}>
                    {partner?.vehicleNumber || 'Not Specified'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 600 }}>Partner Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                      {partner?.status === 'active' ? '🟢 Ready for Orders' : partner?.status === 'busy' ? '🟡 Out on Route' : '⚫ Offline'}
                    </div>
                  </div>
                  <div style={{ background: '#FEF3C7', padding: '12px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 600 }}>Service Hub</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#B45309', marginTop: '2px' }}>Lucknow Central Hub</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Profile Form */
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #DDD6FE',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={editVehicleType}
                    onChange={(e) => setEditVehicleType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #DDD6FE',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#fff',
                    }}
                  >
                    {VEHICLE_OPTIONS.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Vehicle Registration Number (e.g. UP32 AB 1234)
                  </label>
                  <input
                    type="text"
                    required
                    value={editVehicleNumber}
                    onChange={(e) => setEditVehicleNumber(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #DDD6FE',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: profileSaving ? 'not-allowed' : 'pointer',
                    marginTop: '6px',
                  }}
                >
                  {profileSaving ? 'Saving Changes...' : 'Save Updated Profile'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Refresh Button ── */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => partner && loadOrders(partner.partnerId)}
            disabled={ordersLoading}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: '1px solid #C4B5FD',
              background: '#EDE9FE',
              color: '#7C3AED',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Assigned Orders
          </button>
        </div>
      </div>
    </div>
  );
}
