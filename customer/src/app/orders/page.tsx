'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex justify-center">
      <div className="w-full max-w-lg bg-white min-h-screen sm:border-x sm:border-gray-200 sm:shadow-sm flex flex-col" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
        
        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <button onClick={() => router.back()} className="mr-3 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-[16px] font-bold text-gray-900">Your Orders</h1>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pb-32">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
            <Package className="w-10 h-10 text-gray-400 stroke-[1.5]" />
          </div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-2">No recent orders</h2>
          <p className="text-[13px] text-gray-500 mb-8 max-w-[250px] mx-auto">
            Looks like you haven't placed any orders yet. Start shopping to see them here!
          </p>
          <Link href="/" className="stitch-btn w-full max-w-[200px] justify-center min-h-[44px] mx-auto">
            Browse Catalog
          </Link>
        </div>

      </div>
    </div>
  );
}
