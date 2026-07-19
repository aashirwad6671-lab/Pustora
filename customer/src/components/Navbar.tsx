'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

interface StoreOption {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStoreId: string;
  onStoreChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  availableStores: StoreOption[];
  distanceKm?: number | null;
}

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Books', href: '/category/books' },
  { label: 'Stationery', href: '/category/stationery' },
  { label: 'Toys & Gifts', href: '/category/toys' },
  { label: 'Track Order', href: '/cart' },
];

function SearchIcon() {
  return (
    <svg className="navbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="6" strokeWidth={2} />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  );
}

export default function Navbar({
  searchQuery,
  onSearchChange,
  selectedStoreId,
  onStoreChange,
  availableStores,
}: NavbarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const [scrolled, setScrolled] = useState(false);

  const cartCount = items.reduce((acc, it) => acc + it.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const storeOptions = availableStores.length > 0
    ? availableStores
    : [
        { id: 'store-hazratganj', name: 'Hazratganj' },
        { id: 'store-gomtinagar', name: 'Gomti Nagar' },
        { id: 'store-aliganj', name: 'Aliganj' },
      ];

  // Determine active link — exact match for '/', prefix match for others
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const SearchBar = ({ id }: { id: string }) => (
    <div className="navbar-search-inner">
      <SearchIcon />
      <input
        type="text"
        placeholder="Search books, stationery, toys…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="navbar-search-input"
        id={id}
        aria-label="Search products"
      />
      {searchQuery && (
        <button onClick={() => onSearchChange('')} className="navbar-search-clear" aria-label="Clear search">×</button>
      )}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP NAVBAR ── */}
      <header className={`navbar-desktop${scrolled ? ' navbar-scrolled' : ''}`} role="banner">
        <div className="navbar-inner page-container">
          {/* Logo */}
          <Link href="/" className="navbar-logo" id="nav-logo-desktop">
            <span className="navbar-logo-text">PUSTORA</span>
            <span className="navbar-badge">FAST</span>
          </Link>

          {/* Nav links */}
          <nav className="navbar-links" aria-label="Main navigation">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`navbar-link${isActive(l.href) ? ' navbar-link-active' : ''}`}
                aria-current={isActive(l.href) ? 'page' : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Search bar */}
          <div className="navbar-search-wrap">
            <SearchBar id="search-input-desktop" />
          </div>

          {/* Right actions */}
          <div className="navbar-actions">
            {/* Location selector */}
            <div className="navbar-location">
              <span style={{ fontSize: '14px' }}>📍</span>
              <select
                value={selectedStoreId}
                onChange={onStoreChange}
                className="navbar-location-select"
                id="hub-selector-desktop"
                aria-label="Select delivery hub"
              >
                {storeOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.length > 12 ? s.name.split(' ')[0] : s.name}
                  </option>
                ))}
                <option value="add_address">+ Add Address</option>
              </select>
            </div>

            {/* Sign in / Profile */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/profile" className="navbar-profile-btn" id="nav-profile-desktop">
                  <ProfileIcon />
                  {user?.full_name?.split(' ')[0] || 'Profile'}
                </Link>
                <button onClick={logout} className="navbar-logout-btn" id="nav-logout-desktop">Logout</button>
              </div>
            ) : (
              <Link href="/login" className="stitch-btn-secondary" id="nav-signin-desktop"
                style={{ fontSize: '0.8125rem', padding: '8px 16px', minHeight: '44px' }}>
                Sign In / Up
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="navbar-cart" id="nav-cart-desktop" aria-label={`Cart, ${cartCount} items`}>
              <CartIcon />
              {cartCount > 0 && <span className="navbar-cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* ── MOBILE TOP BAR ── */}
      <header className={`navbar-mobile-top${scrolled ? ' navbar-scrolled' : ''}`} role="banner">
        <div className="navbar-mobile-row1">
          <Link href="/" className="navbar-logo" id="nav-logo-mobile">
            <span className="navbar-logo-text navbar-logo-text-sm">PUSTORA</span>
          </Link>

          <div className="navbar-mobile-location">
            <span style={{ fontSize: '13px', flexShrink: 0 }}>📍</span>
            <select
              value={selectedStoreId}
              onChange={onStoreChange}
              className="navbar-mobile-location-select"
              id="hub-selector-mobile"
              aria-label="Select delivery hub"
            >
              {storeOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          <div className="navbar-mobile-right-actions">
            <Link
              href={isAuthenticated ? '/profile' : '/login'}
              className="navbar-mobile-icon-btn"
              id="nav-profile-mobile"
              aria-label={isAuthenticated ? 'My Profile' : 'Sign In'}
            >
              <ProfileIcon />
            </Link>
            <Link href="/cart" className="navbar-mobile-icon-btn navbar-cart" id="nav-cart-mobile"
              aria-label={`Cart, ${cartCount} items`}>
              <CartIcon />
              {cartCount > 0 && (
                <span className="navbar-cart-badge" style={{ fontSize: '8px', width: '16px', height: '16px' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="navbar-mobile-search-row">
          <SearchBar id="search-input-mobile" />
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <Link href="/" className={`bottom-nav-item${pathname === '/' ? ' active' : ''}`} id="bottom-nav-home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </Link>

        <Link href="/category/books" className={`bottom-nav-item${pathname.startsWith('/category') ? ' active' : ''}`} id="bottom-nav-browse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Browse</span>
        </Link>

        <Link href="/cart" className={`bottom-nav-item${pathname === '/cart' ? ' active' : ''}`} id="bottom-nav-cart"
          aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <CartIcon />
            {cartCount > 0 && (
              <span className="navbar-cart-badge" style={{ fontSize: '8px', width: '16px', height: '16px', top: '-6px', right: '-6px' }}>
                {cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Link>

        <Link
          href={isAuthenticated ? '/profile' : '/login'}
          className={`bottom-nav-item${pathname === '/profile' || pathname === '/login' ? ' active' : ''}`}
          id="bottom-nav-profile"
        >
          <ProfileIcon />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}
