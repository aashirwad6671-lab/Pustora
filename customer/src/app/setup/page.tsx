'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '../../types';
import { AuthService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

export default function SetupPage() {
  const router = useRouter();
  const { user, setSession, isAuthenticated } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [area, setArea] = useState('Hazratganj');
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setFullName(user.full_name || '');
      setRole(user.role || 'parent');
    }
  }, [user, isAuthenticated]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      const userId = user?.id || 'demo-user-uuid-12345';
      const phone = user?.phone_number || '+919999999999';

      const profileResponse = await AuthService.createProfile(userId, fullName, role, phone);
      if (profileResponse.error || !profileResponse.data) {
        throw new Error(profileResponse.error || 'Failed to update profile.');
      }

      setSession(profileResponse.data, 'valid-session-jwt');
      setSuccess('Profile updated successfully! Redirecting...');

      setTimeout(() => {
        router.back(); // Go back to the previous page
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Onboarding process failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4" style={{ backgroundColor: 'var(--background)', color: 'var(--deep-text)' }}>
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <Link href="/" className="text-3xl font-black tracking-widest stitch-logo" style={{ color: 'var(--primary)', fontFamily: 'Sora, sans-serif' }}>
          PUSTORA
        </Link>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
          Profile Settings
        </p>
      </div>

      <div className="w-full max-w-md stitch-card">
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          Edit Profile Details
        </h2>
        <p className="text-xs mb-6 text-gray-500">
          Update your personal information and school role.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 font-semibold border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl mb-4 font-medium border border-green-200">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* User Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--primary)' }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="stitch-input w-full"
              required
              id="setup-name"
            />
          </div>

          {/* School Role Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--primary)' }}>
              Choose School Role <span className="text-gray-400 font-normal lowercase">(Optional)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`stitch-btn-secondary capitalize text-xs min-h-[44px] justify-center ${role === 'student' ? 'stitch-chip-active' : ''}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('parent')}
                className={`stitch-btn-secondary capitalize text-xs min-h-[44px] justify-center ${role === 'parent' ? 'stitch-chip-active' : ''}`}
              >
                Parent
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`stitch-btn-secondary capitalize text-xs min-h-[44px] justify-center ${role === 'teacher' ? 'stitch-chip-active' : ''}`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setRole('general')}
                className={`stitch-btn-secondary capitalize text-xs min-h-[44px] justify-center ${role === 'general' ? 'stitch-chip-active' : ''}`}
              >
                Skip
              </button>
            </div>
          </div>


          {/* Submit Action Button */}
          <button
            type="button"
            onClick={handleSetup}
            disabled={loading}
            className="stitch-btn w-full justify-center min-h-[48px]"
            id="btn-complete-setup"
          >
            {loading ? 'Saving Details...' : 'Save Details'}
          </button>
        </div>
      </div>

      <button onClick={() => router.back()} className="text-xs text-gray-500 hover:text-black mt-6 hover:underline min-h-[44px] flex items-center bg-transparent border-none">
        ← Cancel
      </button>
    </div>
  );
}
