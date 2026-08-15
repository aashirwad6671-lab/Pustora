'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Gift } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';

const MOCK_TRANSACTIONS = [
  { id: 't1', type: 'credit', label: 'Cashback — Order #A7C4F2', amount: 25, date: '12 Aug 2026' },
  { id: 't2', type: 'debit', label: 'Used in Order #B3D891', amount: -50, date: '5 Aug 2026' },
  { id: 't3', type: 'credit', label: 'Referral Bonus', amount: 100, date: '28 Jul 2026' },
];

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const balance = 75; // Mock balance

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pb-20" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
      <div className="w-full max-w-lg bg-gray-50 min-h-screen sm:border-x sm:border-gray-200 sm:shadow-sm flex flex-col">

        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => router.back()} className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[16px] font-bold text-gray-900">Pustora Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="m-4 rounded-2xl overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-white opacity-80" />
              <span className="text-white text-[13px] font-medium opacity-80">Available Balance</span>
            </div>
            <div className="text-white text-[40px] font-black" style={{ fontFamily: 'Sora, sans-serif' }}>
              ₹{balance}
            </div>
            <p className="text-white text-[12px] mt-2 opacity-70">
              Used automatically at checkout · No expiry
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 grid grid-cols-2 divide-x divide-white/20">
            <button className="py-3 text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
              <ArrowDownLeft size={16} />
              Add Money
            </button>
            <button className="py-3 text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
              <Gift size={16} />
              Earn More
            </button>
          </div>
        </div>

        {/* How to earn */}
        <div className="mx-4 mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-[13px] font-bold text-amber-800 mb-2">💡 How to earn more</p>
          <ul className="space-y-1.5">
            <li className="text-[12px] text-amber-700 flex gap-2"><span>•</span> Get ₹100 for every successful referral</li>
            <li className="text-[12px] text-amber-700 flex gap-2"><span>•</span> 5% cashback on every order above ₹500</li>
            <li className="text-[12px] text-amber-700 flex gap-2"><span>•</span> First order bonus: ₹50 on signup</li>
          </ul>
        </div>

        {/* Transaction History */}
        <div className="px-4 mb-2">
          <h3 className="text-[14px] font-bold text-gray-800 mb-3">Transaction History</h3>
        </div>
        <div className="bg-white border-y border-gray-100 divide-y divide-gray-50">
          {MOCK_TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="flex items-center px-4 py-3.5 gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                {tx.type === 'credit'
                  ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                  : <ArrowUpRight className="w-4 h-4 text-red-500" />
                }
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-900">{tx.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{tx.date}</p>
              </div>
              <span className={`text-[14px] font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                {tx.type === 'credit' ? '+' : ''}₹{Math.abs(tx.amount)}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 text-center">
          <p className="text-[11px] text-gray-400">Wallet is managed by Pustora. <Link href="/" className="text-purple-600 font-medium">Terms apply.</Link></p>
        </div>
      </div>
    </div>
  );
}
