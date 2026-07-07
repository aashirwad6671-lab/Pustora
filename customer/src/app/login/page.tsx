'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

type Mode = 'login' | 'signup' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { setSession, setLoading } = useAuthStore();

  const [mode, setMode] = useState<Mode>('signup');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpToken, setOtpToken] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const formatPhoneNumber = (num: string) => {
    let cleaned = num.replace(/\D/g, '');
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return '+' + cleaned;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!email || !password) {
      setError('Please fill in both email and password.'); return;
    }

    setLoadingLocal(true); setLoading(true);
    try {
      const res = await AuthService.signInWithEmail(email, password);
      if (res.error) throw new Error(res.error);
      
      setSuccess('Logged in successfully!');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to login.');
    } finally {
      setLoadingLocal(false); setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    
    if (!email || !password || phoneNumber.length < 10) {
      setError('Please fill in all fields (Email, Password, and 10-digit phone).'); return;
    }

    setLoadingLocal(true); setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const res = await AuthService.signUpWithEmail(email, password, formattedPhone);
      if (res.error) throw new Error(res.error);
      
      setSuccess('Signup successful! Check your email for the verification code.');
      setMode('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    } finally {
      setLoadingLocal(false); setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (otpToken.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.'); return;
    }

    setLoadingLocal(true); setLoading(true);
    try {
      const res = await AuthService.verifyEmailOTP(email, otpToken);
      if (res.error || !res.data) throw new Error(res.error || 'Verification failed');
      
      setSuccess('Email verified successfully!');
      const data = res.data;
      setTimeout(() => {
        if (data?.isNewUser) {
          router.push('/setup');
        } else {
          router.push('/');
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoadingLocal(false); setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingLocal(true); setLoading(true);
    try {
      await AuthService.signInWithGoogle();
      // Page will redirect automatically
    } catch (err: any) {
      setError(err.message || 'Google Sign in failed.');
      setLoadingLocal(false); setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4" style={{ backgroundColor: 'var(--background)', color: 'var(--deep-text)' }}>
      <div className="text-center mb-8 space-y-2">
        <Link href="/" className="text-4xl font-black tracking-widest stitch-logo" style={{ color: 'var(--primary)', fontFamily: 'Sora, sans-serif' }}>
          PUSTORA
        </Link>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
          "Har Zaroorat, Ek App"
        </p>
      </div>

      <div className="w-full max-w-sm stitch-card relative overflow-hidden">
        <h2 className="text-xl font-bold mb-1 text-center" style={{ fontFamily: 'Sora, sans-serif' }}>
          {mode === 'login' && 'Sign In to your Account'}
          {mode === 'signup' && 'Create a New Account'}
          {mode === 'otp' && 'Email Verification'}
        </h2>
        <p className="text-xs text-center mb-6 text-gray-500">
          {mode === 'login' && 'Access Lucknow’s 10-minute school bookstore'}
          {mode === 'signup' && 'Join the fastest school delivery network'}
          {mode === 'otp' && `Enter the OTP sent to ${email}`}
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

        {mode === 'login' && (
          <div className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--primary)' }}>Email Address</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="stitch-input w-full" required />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--primary)' }}>Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="stitch-input w-full" required />
              </div>
              <button type="submit" disabled={loadingLocal} className="stitch-btn w-full justify-center min-h-[48px]">
                {loadingLocal ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button onClick={handleGoogleLogin} disabled={loadingLocal} className="stitch-btn-secondary w-full justify-center min-h-[48px] flex items-center gap-2 bg-white" style={{ borderColor: '#E5E7EB', color: '#374151' }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <button type="button" onClick={() => { setMode('signup'); setError(null); setSuccess(null); }} className="w-full text-center text-xs font-bold hover:underline pt-2 block text-gray-500">
              Don't have an account? <span style={{ color: 'var(--primary)' }}>Sign Up</span>
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--primary)' }}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="stitch-input w-full" required />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--primary)' }}>Password</label>
              <input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} className="stitch-input w-full" required />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--primary)' }}>Indian Mobile Number</label>
              <div className="flex gap-2">
                <span className="rounded-xl px-3 py-3 text-sm flex items-center justify-center font-bold bg-white border" style={{ borderColor: 'var(--outline)' }}>+91</span>
                <input type="tel" placeholder="10-digit mobile number" maxLength={10} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className="stitch-input flex-1" required />
              </div>
            </div>
            
            <button type="submit" disabled={loadingLocal} className="stitch-btn w-full justify-center min-h-[48px]">
              {loadingLocal ? 'Creating account...' : 'Sign Up'}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="w-full text-center text-xs font-bold hover:underline pt-2 block text-gray-500">
              Already have an account? <span style={{ color: 'var(--primary)' }}>Sign In</span>
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--primary)' }}>6-Digit OTP Code</label>
              <input type="text" placeholder="Enter code sent to email" maxLength={6} value={otpToken} onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))} className="stitch-input text-center text-lg font-bold w-full" required />
            </div>
            <button type="submit" disabled={loadingLocal} className="stitch-btn w-full justify-center min-h-[48px]">
              {loadingLocal ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button type="button" onClick={() => { setMode('signup'); setError(null); setSuccess(null); }} className="w-full text-center text-xs font-bold hover:underline py-2 block" style={{ color: 'var(--primary)' }}>
              Change Email
            </button>
          </form>
        )}
      </div>

      <Link href="/" className="text-xs text-gray-500 hover:text-black mt-8 hover:underline min-h-[44px] flex items-center">
        ← Back to Browse Catalog
      </Link>
    </div>
  );
}
