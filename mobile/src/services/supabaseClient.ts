import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Production secure storage adapter for Expo mobile devices
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase configuration keys are missing. Verify EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your env file.'
  );
}

console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log("Supabase Key (prefix):", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20));

// Instantiate the singleton Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Mobile deep link configuration handled separately
  },
});

(async () => {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    console.log("Direct connection test initiating... URL:", url);
    const res = await fetch(
      url + "/rest/v1/",
      {
        headers: {
          apikey: key,
        },
      }
    );
    console.log("Direct Connection Test Status:", res.status);
    const text = await res.text();
    console.log("Direct Connection Test Response:", text);
  } catch (err: any) {
    console.error("Direct Connection Test Error:", err.message || err);
  }
})();
