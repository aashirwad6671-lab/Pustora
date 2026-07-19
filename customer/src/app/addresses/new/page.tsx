'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { AuthService } from '../../../services/authService';

const BLUE = '#2874f0';
const GRAY_BG = '#f1f3f6';
const BORDER = '#d0d5dd';
const BORDER_FOCUS = '#2874f0';
const TEXT_MAIN = '#212121';
const TEXT_MUTED = '#878787';
const INPUT_H = '48px';

const inp = (focused: boolean): React.CSSProperties => ({
  width: '100%',
  height: INPUT_H,
  border: `1px solid ${focused ? BORDER_FOCUS : BORDER}`,
  borderRadius: '2px',
  padding: '0 14px',
  fontSize: '14px',
  color: TEXT_MAIN,
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
});

function Input({
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inp(focused)}
        placeholder=""
        autoComplete="off"
        required={required}
      />
      <label
        style={{
          position: 'absolute',
          left: '14px',
          top: value || focused ? '-10px' : '50%',
          transform: value || focused ? 'none' : 'translateY(-50%)',
          fontSize: value || focused ? '11px' : '14px',
          color: focused ? BLUE : TEXT_MUTED,
          background: value || focused ? '#fff' : 'transparent',
          padding: value || focused ? '0 3px' : '0',
          pointerEvents: 'none',
          transition: 'all 0.15s ease',
          zIndex: 1,
        }}
      >
        {placeholder}{required && <span style={{ color: '#e53935' }}> *</span>}
      </label>
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inp(focused), appearance: 'none', cursor: 'pointer' }}
        required={required}
      >
        <option value="" disabled />
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <label
        style={{
          position: 'absolute',
          left: '14px',
          top: value || focused ? '-10px' : '50%',
          transform: value || focused ? 'none' : 'translateY(-50%)',
          fontSize: value || focused ? '11px' : '14px',
          color: focused ? BLUE : TEXT_MUTED,
          background: value || focused ? '#fff' : 'transparent',
          padding: value || focused ? '0 3px' : '0',
          pointerEvents: 'none',
          transition: 'all 0.15s ease',
          zIndex: 1,
        }}
      >
        {placeholder}{required && <span style={{ color: '#e53935' }}> *</span>}
      </label>
      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: TEXT_MUTED }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
].map((s) => ({ label: s, value: s }));

export default function AddAddressPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [pincode, setPincode] = useState('');
  const [locality, setLocality] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const handleSave = async () => {
    if (!name || !phone || !pincode || !locality || !addressLine || !city || !state) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const lat = 26.8467;
      const lng = 80.9462;
      const res = await AuthService.setupAddress(
        user.id,
        addressType,
        addressLine,
        locality,
        pincode,
        lat,
        lng,
        true
      );
      if (res.error) throw new Error(res.error);
      router.push('/addresses');
    } catch (err: any) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: GRAY_BG, fontFamily: '"Roboto", "DM Sans", sans-serif', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: TEXT_MAIN, margin: 0, letterSpacing: '0.2px' }}>
            ADD A NEW ADDRESS
          </h1>
        </div>
      </div>

      {/* Card */}
      <div style={{ maxWidth: '860px', margin: '24px auto', background: '#fff', borderRadius: '2px', border: `1px solid ${BORDER}`, padding: '0' }}>
        {/* Section title */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: '12px', color: TEXT_MUTED, margin: 0, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            Contact Details
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Row 1 — Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <Input placeholder="Full Name" value={name} onChange={setName} required />
            <Input placeholder="10-digit Mobile Number" value={phone} onChange={setPhone} type="tel" required />
          </div>

          {/* Address section title */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: TEXT_MUTED, margin: '0 0 20px 0', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Address Details
            </p>

            {/* Row 2 — Pincode & Locality */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <Input placeholder="Pincode" value={pincode} onChange={setPincode} required />
              <Input placeholder="Locality" value={locality} onChange={setLocality} required />
            </div>

            {/* Row 3 — Address textarea */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <textarea
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                rows={3}
                style={{
                  width: '100%', border: `1px solid ${BORDER}`, borderRadius: '2px',
                  padding: '14px', fontSize: '14px', color: TEXT_MAIN, outline: 'none',
                  resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = BORDER_FOCUS; }}
                onBlur={(e) => { e.target.style.borderColor = BORDER; }}
                placeholder=""
              />
              <label style={{
                position: 'absolute', left: '14px',
                top: addressLine ? '-10px' : '16px',
                fontSize: addressLine ? '11px' : '14px',
                color: addressLine ? BLUE : TEXT_MUTED,
                background: addressLine ? '#fff' : 'transparent',
                padding: addressLine ? '0 3px' : '0',
                pointerEvents: 'none', transition: 'all 0.15s ease',
              }}>
                Address (Area and Street) <span style={{ color: '#e53935' }}>*</span>
              </label>
            </div>

            {/* Row 4 — City & State */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <Input placeholder="City / District / Town" value={city} onChange={setCity} required />
              <SelectInput placeholder="State" value={state} onChange={setState} options={STATES} required />
            </div>

            {/* Row 5 — Landmark & Alt Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <Input placeholder="Landmark (Optional)" value={landmark} onChange={setLandmark} />
              <Input placeholder="Alternate Phone (Optional)" value={altPhone} onChange={setAltPhone} type="tel" />
            </div>
          </div>

          {/* Address Type */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '20px', marginBottom: '4px' }}>
            <p style={{ fontSize: '12px', color: TEXT_MUTED, margin: '0 0 14px 0', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Address Type
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              {(['Home', 'Work', 'Other'] as const).map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="addressType"
                    value={type}
                    checked={addressType === type}
                    onChange={() => setAddressType(type)}
                    style={{ accentColor: BLUE, width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px', color: TEXT_MAIN }}>{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ maxWidth: '860px', margin: '0 auto 16px', padding: '0 20px' }}>
          <div style={{ background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: '2px', padding: '12px 16px', color: '#c62828', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Sticky Save Button (mobile-friendly) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: `1px solid ${BORDER}`,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '20px',
        zIndex: 20,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', gap: '16px', width: '100%' }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: loading ? '#90b8f8' : BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              padding: '0 40px',
              height: '48px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px',
              minWidth: '160px',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'SAVING...' : 'SAVE ADDRESS'}
          </button>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: BLUE,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.3px',
              fontFamily: 'inherit',
              padding: '0 8px',
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
