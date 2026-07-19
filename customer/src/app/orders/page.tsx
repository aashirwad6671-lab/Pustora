'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import { Package, ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import type { Order, OrderStatus } from '../../types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed:           { label: 'Order Placed',      color: '#2874f0', bg: '#eff6ff' },
  confirmed:        { label: 'Confirmed',          color: '#7c3aed', bg: '#f5f3ff' },
  packed:           { label: 'Packed',             color: '#d97706', bg: '#fffbeb' },
  out_for_delivery: { label: 'Out for Delivery',   color: '#0891b2', bg: '#ecfeff' },
  delivered:        { label: 'Delivered',          color: '#16a34a', bg: '#f0fdf4' },
  cancelled:        { label: 'Cancelled',          color: '#dc2626', bg: '#fef2f2' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Realtime subscription so status changes reflect immediately here too
    if (!user?.id) return;
    const channel = supabase
      .channel('user-orders-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated, router, user]);

  if (!isAuthenticated || !user) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-lg bg-gray-50 min-h-screen sm:border-x sm:border-gray-200 sm:shadow-sm flex flex-col" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>

        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => router.back()} className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[16px] font-bold text-gray-900">Your Orders</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Loading your orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pb-32">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                <Package className="w-10 h-10 text-gray-300 stroke-[1.5]" />
              </div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-2">No recent orders</h2>
              <p className="text-[13px] text-gray-500 mb-8 max-w-[240px] mx-auto">
                Looks like you haven't placed any orders yet. Start shopping to see them here!
              </p>
              <Link href="/" className="stitch-btn max-w-[200px] w-full justify-center min-h-[44px] mx-auto">
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['placed'];
                return (
                  <div key={order.id} className="bg-white p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[12px] text-gray-500 font-medium mb-0.5">Order ID</p>
                        <p className="text-[13px] font-bold text-gray-900 font-mono">
                          #{order.id.substring(0, 12).toUpperCase()}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Middle row */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <p className="text-[13px] text-gray-700 truncate">{order.delivery_address}</p>
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[12px]">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-gray-900">₹{order.grand_total}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
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
