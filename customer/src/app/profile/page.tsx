'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import {
  Package,
  Wallet,
  MessageCircleQuestion,
  BookUser,
  GraduationCap,
  Heart,
  ReceiptText,
  TicketPercent,
  CreditCard,
  Gift,
  Share2,
  Info,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const ListItem = ({
    icon: Icon,
    title,
    subtitle,
    onClick,
    href,
  }: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    href?: string;
  }) => {
    const content = (
      <div className="flex items-center justify-between py-4 border-b border-gray-100 bg-white px-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-700 stroke-[1.5]" />
          <div>
            <div className="text-[14px] font-medium text-gray-900">{title}</div>
            {subtitle && <div className="text-[12px] text-gray-500 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 stroke-[1.5]" />
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="block cursor-pointer">
          {content}
        </Link>
      );
    }

    return (
      <button onClick={onClick} className="w-full text-left cursor-pointer appearance-none bg-transparent border-none p-0">
        {content}
      </button>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 pt-6 pb-2 bg-gray-50/50">
      <h3 className="text-[14px] font-bold text-gray-800">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex justify-center pb-20">
      <div className="w-full max-w-lg bg-gray-50/50 min-h-screen sm:border-x sm:border-gray-200 sm:shadow-sm">
        
        {/* 1. Top Header */}
        <div className="bg-white px-4 pt-8 pb-8 flex flex-col items-center justify-center border-b border-gray-100">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-500 font-medium">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{user.full_name || 'Your account'}</h1>
          <p className="text-sm text-gray-500 mt-1">{user.phone_number}</p>
          <Link href="/setup" className="mt-4 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
            Edit Profile
          </Link>
        </div>

        {/* 2. Quick Action Cards */}
        <div className="bg-white px-4 py-6 border-b border-gray-100">
          <div className="flex flex-row items-center justify-between gap-3">
            <Link href="/cart" className="flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-xl border border-gray-200 shadow-sm bg-white hover:bg-gray-50 transition-colors h-24">
              <Package className="w-7 h-7 text-gray-800 stroke-[1.5] mb-2" />
              <span className="text-xs font-medium text-gray-800 text-center leading-tight">Your orders</span>
            </Link>
            <button className="flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-xl border border-gray-200 shadow-sm bg-white hover:bg-gray-50 transition-colors h-24">
              <Wallet className="w-7 h-7 text-gray-800 stroke-[1.5] mb-2" />
              <span className="text-xs font-medium text-gray-800 text-center leading-tight">Pustora Wallet</span>
            </button>
            <button className="flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-xl border border-gray-200 shadow-sm bg-white hover:bg-gray-50 transition-colors h-24">
              <MessageCircleQuestion className="w-7 h-7 text-gray-800 stroke-[1.5] mb-2" />
              <span className="text-xs font-medium text-gray-800 text-center leading-tight">Need help?</span>
            </button>
          </div>
        </div>

        {/* 3. Your Information */}
        <SectionHeader title="Your information" />
        <div className="bg-white border-y border-gray-100">
          <ListItem icon={BookUser} title="Address book" href="/setup" />
          <ListItem icon={GraduationCap} title="My Students / School Details" subtitle="Save school & class to quickly find combos" href="/setup" />
          <ListItem icon={Heart} title="Your wishlist" />
          <ListItem icon={ReceiptText} title="GST details" />
        </div>

        {/* 4. Payments and Offers */}
        <SectionHeader title="Payments and coupons" />
        <div className="bg-white border-y border-gray-100">
          <ListItem icon={TicketPercent} title="Coupons & offers" />
          <ListItem icon={CreditCard} title="Payment settings" />
          <ListItem icon={Gift} title="Refer & Earn" subtitle="Invite friends and get discount" />
        </div>

        {/* 5. Other Information */}
        <SectionHeader title="Other information" />
        <div className="bg-white border-y border-gray-100 mb-6">
          <ListItem icon={Share2} title="Share the app" />
          <ListItem icon={Info} title="About us" />
          <ListItem icon={ShieldCheck} title="Account privacy" subtitle="Data protection and deletion" />
          <ListItem icon={Bell} title="Notification preferences" />
          <ListItem icon={LogOut} title="Log out" onClick={handleLogout} />
        </div>
        
        <div className="text-center py-8">
          <h4 className="text-gray-400 font-bold tracking-widest text-lg">PUSTORA</h4>
          <p className="text-xs text-gray-400 mt-1">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
