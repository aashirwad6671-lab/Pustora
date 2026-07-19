'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Address } from '../../types';

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

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-lg bg-gray-50 min-h-screen sm:border-x sm:border-gray-200 sm:shadow-sm flex flex-col" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
        
        {/* Header */}
        <div className="flex items-center px-4 py-4 bg-[#2874f0] text-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => router.back()} className="mr-4 p-1 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-[16px] font-semibold tracking-wide">My Addresses</h1>
        </div>

        {/* Add Address Button (Always visible at top if we want, or in empty state) */}
        <div className="p-3 bg-gray-50">
          <Link href="/addresses/new" className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 shadow-sm text-[#2874f0] font-semibold text-sm hover:bg-gray-50 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Add a new address</span>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading addresses...</div>
          ) : addresses.length > 0 ? (
            <div className="px-3 pb-8 space-y-3">
              {addresses.map((address) => (
                <div key={address.id} className="bg-white p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        {address.label}
                      </span>
                      {address.is_default && (
                        <span className="text-[#2874f0] text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Name and Phone would go here if we stored them */}
                  <p className="text-sm text-gray-800 font-medium mb-1">
                    {user.full_name || 'Your Name'} <span className="font-normal text-gray-500 ml-2">{user.phone_number}</span>
                  </p>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    {address.address_line1}
                    {address.address_line2 ? `, ${address.address_line2}` : ''}
                    <br />
                    {address.area}, {address.city}, {address.state} - <span className="font-medium text-black">{address.pincode}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pb-32">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-16 h-16 text-gray-300 stroke-[1.5]" />
              </div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-2">No Addresses found</h2>
              <p className="text-[13px] text-gray-500 mb-8 max-w-[250px] mx-auto">
                You haven't saved any addresses yet. Add a new address to proceed with your orders faster.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
