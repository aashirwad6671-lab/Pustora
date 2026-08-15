'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Plus,
  Sparkles,
  Copy,
  Check,
  CreditCard,
  Zap,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CartBar from '../../components/CartBar';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  label: string;
  category: string;
  amount: number;
  date: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'credit', label: 'Cashback — Order #LKO-8492', category: 'Cashback', amount: 35, date: 'Today, 2:15 PM' },
  { id: 't2', type: 'debit', label: 'Paid for Class 6 NCERT Books', category: 'Order Payment', amount: -280, date: '14 Aug 2026' },
  { id: 't3', type: 'credit', label: 'Referral Bonus (Friend joined)', category: 'Referral', amount: 100, date: '10 Aug 2026' },
  { id: 't4', type: 'credit', label: 'Welcome Bonus on Signup', category: 'Welcome Offer', amount: 50, date: '01 Aug 2026' },
];

const PRESETS = [100, 250, 500, 1000];

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [balance, setBalance] = useState<number>(170);
  const [selectedPreset, setSelectedPreset] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('250');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');
  const [isAddingMoney, setIsAddingMoney] = useState<boolean>(false);
  const [addSuccess, setAddSuccess] = useState<boolean>(false);
  const [copiedReferral, setCopiedReferral] = useState<boolean>(false);

  const referralCode = 'PUST-LKO2026';

  const handleSelectPreset = (val: number) => {
    setSelectedPreset(val);
    setCustomAmount(String(val));
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setSelectedPreset(Number(val));
  };

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(customAmount);
    if (!amt || amt < 10) return;

    setIsAddingMoney(true);
    setTimeout(() => {
      setBalance((prev) => prev + amt);
      const newTx: Transaction = {
        id: `t-${Date.now()}`,
        type: 'credit',
        label: `Added via UPI / Card`,
        category: 'Top Up',
        amount: amt,
        date: 'Just now',
      };
      setTransactions((prev) => [newTx, ...prev]);
      setIsAddingMoney(false);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    }, 900);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    return tx.type === activeTab;
  });

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar searchQuery="" onSearchChange={() => {}} selectedStoreId="" onStoreChange={() => {}} availableStores={[]} />

      <main className="wallet-page-wrapper">
        {/* Navigation Breadcrumb / Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
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
              Pustora Wallet
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: 0 }}>
              Instant 1-click checkout & cashback rewards
            </p>
          </div>
        </div>

        {/* HERO BALANCE CARD */}
        <div className="wallet-balance-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Wallet size={22} color="#fff" />
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Available Balance
                </span>
                <div style={{ fontSize: '11px', color: '#A7F3D0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} fill="#A7F3D0" /> 100% Usable on all Orders
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Sparkles size={13} color="#FDE047" fill="#FDE047" /> Pustora Pay
            </div>
          </div>

          <div style={{ fontSize: '2.75rem', fontWeight: 900, fontFamily: 'Sora, sans-serif', lineHeight: 1.1, marginBottom: '12px', letterSpacing: '-0.5px' }}>
            ₹{balance}
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            Automatically deducted at checkout for seamless 10-minute order placement.
          </p>
        </div>

        {/* TOP UP / ADD MONEY SECTION */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid var(--outline)',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 24px rgba(108,63,214,0.04)',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', marginBottom: '6px' }}>
            Top Up Wallet
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
            Add money via UPI (GPay, PhonePe, Paytm), Net Banking, or Debit/Credit Cards.
          </p>

          {addSuccess && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#065F46',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <Check size={16} /> ₹{customAmount} added to your wallet successfully!
            </div>
          )}

          {/* Preset Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectPreset(amt)}
                className={`wallet-preset-chip ${selectedPreset === amt ? 'active' : ''}`}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          {/* Amount input & Recharge CTA */}
          <form onSubmit={handleAddMoney} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: '16px', color: 'var(--deep-text)' }}>
                ₹
              </span>
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Enter amount"
                className="stitch-input"
                style={{ width: '100%', paddingLeft: '34px', fontSize: '15px', fontWeight: 700 }}
              />
            </div>

            <button
              type="submit"
              disabled={isAddingMoney || !customAmount || Number(customAmount) < 10}
              className="stitch-btn"
              style={{ minHeight: '46px', padding: '0 24px', fontSize: '14px', flexShrink: 0 }}
            >
              {isAddingMoney ? (
                <span>Adding ₹{customAmount}...</span>
              ) : (
                <>
                  <Plus size={16} style={{ marginRight: '6px' }} />
                  Add Money Instantly
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              <ShieldCheck size={14} /> 100% Safe & Encrypted Payments
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
              <CreditCard size={14} /> Zero convenience fee
            </div>
          </div>
        </div>

        {/* HOW TO EARN / REWARDS PERKS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {/* Referral Box */}
          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '1px solid #FCD34D',
            borderRadius: '18px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Gift size={20} color="#92400E" />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#78350F' }}>
                Refer & Earn ₹100
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.4, marginBottom: '14px' }}>
              Share your referral code with school parents & friends. Get ₹100 on their first order!
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                background: '#fff',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#78350F',
                border: '1px dashed #F59E0B',
                flex: 1,
                textAlign: 'center',
                letterSpacing: '0.05em',
              }}>
                {referralCode}
              </div>
              <button
                type="button"
                onClick={handleCopyReferral}
                style={{
                  background: '#78350F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copiedReferral ? <Check size={14} /> : <Copy size={14} />}
                {copiedReferral ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Cashback Promo */}
          <div style={{
            background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
            border: '1px solid #C4B5FD',
            borderRadius: '18px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={20} color="#5B21B6" />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#4C1D95' }}>
                5% Order Cashback
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#5B21B6', lineHeight: 1.4, margin: '0 0 12px' }}>
              Get flat 5% cashback automatically credited to your wallet on every school book bundle order over ₹500.
            </p>
            <Link
              href="/"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Shop School Sets →
            </Link>
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid var(--outline)',
          boxShadow: '0 4px 24px rgba(108,63,214,0.04)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--outline)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--deep-text)', fontFamily: 'Sora, sans-serif', margin: 0 }}>
              Transaction History
            </h3>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: '#F8F4FF', padding: '4px', borderRadius: '10px' }}>
              {(['all', 'credit', 'debit'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeTab === tab ? '#fff' : 'transparent',
                    color: activeTab === tab ? 'var(--primary)' : 'var(--on-surface-variant)',
                    boxShadow: activeTab === tab ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.15s ease',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'credit' ? 'Credits (+)' : tab === 'debit' ? 'Debits (-)' : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div>
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--on-surface-variant)' }}>
                <p style={{ fontSize: '13px', margin: 0 }}>No transactions found for this filter.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="wallet-tx-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: tx.type === 'credit' ? '#ECFDF5' : '#FEF2F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft size={18} color="#10B981" />
                      ) : (
                        <ArrowUpRight size={18} color="#EF4444" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--deep-text)' }}>
                        {tx.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                        {tx.category} · {tx.date}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: tx.type === 'credit' ? '#10B981' : '#EF4444',
                    fontFamily: 'Sora, sans-serif',
                  }}>
                    {tx.type === 'credit' ? '+' : ''}₹{Math.abs(tx.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FOOTER NOTE */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', margin: '0 0 20px' }}>
          Pustora Wallet balance is securely maintained and never expires. Need assistance? <Link href="/help" style={{ color: 'var(--primary)', fontWeight: 600 }}>Contact 24/7 Support</Link>
        </p>
      </main>

      <Footer />
      <CartBar />
    </div>
  );
}
