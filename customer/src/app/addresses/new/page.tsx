'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { Crosshair } from 'lucide-react';
import { AuthService } from '../../../services/authService';

export default function AddAddressPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [pincode, setPincode] = useState('');
  const [locality, setLocality] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [addressType, setAddressType] = useState('Home');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSave = async () => {
    if (!name || !phone || !pincode || !locality || !addressLine || !city || !state) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Mock latitude/longitude for now. In real app, geocode the pincode/locality.
      const lat = 26.8467;
      const lng = 80.9462;

      // Note: We are using AuthService.setupAddress which only saves basic fields currently.
      // Name, Phone, Landmark, AltPhone are mocked in UI but not stored in Supabase yet.
      const res = await AuthService.setupAddress(
        user.id,
        addressType,
        addressLine,
        locality, // using locality as area
        pincode,
        lat,
        lng,
        true // make default
      );

      if (res.error) {
        throw new Error(res.error);
      }

      // Success
      router.push('/addresses');
    } catch (err: any) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] flex justify-center pb-10" style={{ fontFamily: 'Roboto, var(--font-sans, sans-serif)' }}>
      <div className="w-full max-w-[800px] bg-white min-h-screen sm:min-h-fit sm:mt-8 sm:border sm:border-gray-200 sm:shadow-sm">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <h1 className="text-[16px] font-medium text-[#2874f0] uppercase tracking-wide">Add a new address</h1>
        </div>

        <div className="p-6">
          <button className="flex items-center gap-2 bg-[#2874f0] text-white px-4 py-2.5 rounded-sm font-medium text-[14px] shadow-sm hover:shadow-md transition-shadow mb-6">
            <Crosshair className="w-4 h-4" />
            Use my current location
          </button>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4 max-w-full">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors"
              />
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors"
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors"
              />
              <input
                type="text"
                placeholder="Locality"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors"
              />
            </div>

            {/* Row 3 - Full Width Textarea */}
            <div>
              <textarea
                placeholder="Address (Area and Street)"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors resize-none"
              />
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City/District/Town"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors"
              />
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors appearance-none bg-white text-gray-700"
                >
                  <option value="" disabled>--Select State--</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Landmark (Optional)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors"
              />
              <input
                type="tel"
                placeholder="Alternate Phone (Optional)"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-[14px] focus:outline-none focus:border-[#2874f0] rounded-sm transition-colors"
              />
            </div>

            {/* Address Type */}
            <div className="pt-4">
              <span className="block text-[12px] text-gray-500 mb-3">Address Type</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="addressType"
                    value="Home"
                    checked={addressType === 'Home'}
                    onChange={(e) => setAddressType(e.target.value)}
                    className="w-4 h-4 text-[#2874f0] focus:ring-[#2874f0] border-gray-300"
                  />
                  <span className="text-[14px] text-gray-700">Home</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="addressType"
                    value="Work"
                    checked={addressType === 'Work'}
                    onChange={(e) => setAddressType(e.target.value)}
                    className="w-4 h-4 text-[#2874f0] focus:ring-[#2874f0] border-gray-300"
                  />
                  <span className="text-[14px] text-gray-700">Work</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-8 flex items-center gap-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-[#2874f0] text-white px-10 py-3 rounded-sm font-medium text-[14px] min-w-[150px] hover:bg-[#2874f0]/90 transition-colors"
              >
                {loading ? 'SAVING...' : 'SAVE'}
              </button>
              <button
                onClick={() => router.back()}
                className="text-[#2874f0] font-medium text-[14px] px-4 py-3 hover:bg-gray-50 rounded-sm transition-colors"
              >
                CANCEL
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
