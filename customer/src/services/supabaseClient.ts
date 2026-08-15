import { createClient } from '@supabase/supabase-js';

// Browser-safe local storage adapter
const WebLocalStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erhuepjjtuwnpzcgduxz.supabase.co';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaHVlcGpqdHV3bnB6Y2dkdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTMwOTIsImV4cCI6MjA5NTk4OTA5Mn0.Dea4Uz-HfCjdxbmlyEI1DFXlhOCzsz2e0H5HA7LKhS0';

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://placeholder-pustora.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: WebLocalStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
