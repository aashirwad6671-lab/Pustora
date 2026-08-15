'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Trash2, Home, Building2, Check } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Address } from '../../types';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CartBar from '../../components/CartBar';

export default function AddressesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchAddresses = async () => {
      try {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        if (error) throw error;
        setAddresses(data || []);
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated, router, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this address?')) {
      await supabase.from('addresses').delete().eq('id', id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar searchQuery="" onSearchChange={() => {}} selectedStoreId="" onStoreChange={() => {}} availableStores={[]} />

      <main style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '80px auto 60px', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#fff',
                border: '1px solid var(--outline)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(108,63,214,0.06)',
              }}
              aria-label="Go Back"
            >
              <ArrowLeft size={18} color="var(--deep-text)" />
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', margin: 0 }}>
                Delivery Addresses
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: 0 }}>
                Manage your saved home & school delivery addresses in Lucknow
              </p>
            </div>
          </div>

          <Link
            href="/addresses/new"
            className="stitch-btn"
            style={{ fontSize: '13px', minHeight: '40px', padding: '0 16px', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add New Address</span>
          </Link>
        </div>

        {/* Address Cards List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--on-surface-variant)' }}>
            Loading your addresses...
          </div>
        ) : addresses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {addresses.map((address) => (
              <div
                key={address.id}
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: address.is_default ? '2px solid var(--primary)' : '1px solid var(--outline)',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(108,63,214,0.04)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--tint-chip)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {address.label?.toLowerCase() === 'work' ? <Building2 size={16} /> : <Home size={16} />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--deep-text)' }}>
                      {address.label || 'Home'}
                    </span>
                    {address.is_default && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: '#ECFDF5',
                        color: '#059669',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}>
                        <Check size={12} /> Default
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(address.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'color 0.15s ease',
                    }}
                    title="Delete Address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--deep-text)', marginBottom: '4px' }}>
                  {user.full_name || 'Customer'} <span style={{ fontWeight: 500, color: 'var(--on-surface-variant)', marginLeft: '6px' }}>{user.phone_number}</span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: 0 }}>
                  {address.address_line1}
                  {address.address_line2 ? `, ${address.address_line2}` : ''}
                  <br />
                  {address.area}, {address.city}, {address.state} — <strong>{address.pincode}</strong>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid var(--outline)',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(108,63,214,0.04)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'var(--tint-chip)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <MapPin size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', marginBottom: '6px' }}>
              No Addresses Saved Yet
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', maxWidth: '320px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Add your delivery location in Lucknow to enjoy superfast 10-minute book & stationery doorstep delivery.
            </p>
            <Link href="/addresses/new" className="stitch-btn" style={{ display: 'inline-flex', gap: '6px' }}>
              <Plus size={16} /> Add First Address
            </Link>
          </div>
        )}
      </main>

      <Footer />
      <CartBar />
    </div>
  );
}
