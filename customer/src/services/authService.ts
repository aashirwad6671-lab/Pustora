import { supabase } from './supabaseClient';
import { ApiResponse } from './api.types';
import { Profile, UserRole } from '../types';

export class AuthService {
  /**
   * Signs in a user using Email and Password.
   */
  static async signInWithEmail(email: string, password: string): Promise<ApiResponse<{ userId: string }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      const userId = data.user?.id;
      if (!userId) {
        return { data: null, error: 'User session not found', status: 400 };
      }

      return { data: { userId }, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Login failed', status: 500 };
    }
  }

  /**
   * Signs up a new user using Email and Password.
   * Also stores the phone number in user metadata.
   */
  static async signUpWithEmail(email: string, password: string, phoneNumber: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: phoneNumber,
          },
        },
      });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Signup failed', status: 500 };
    }
  }

  /**
   * Verifies the email OTP token sent during signup.
   */
  static async verifyEmailOTP(email: string, token: string): Promise<ApiResponse<{ userId: string; isNewUser: boolean }>> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: 'signup',
      });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      const userId = data.user?.id;
      if (!userId) {
        return { data: null, error: 'User session not found', status: 400 };
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();

      const isNewUser = !profile || !profile.role;

      return {
        data: { userId, isNewUser },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'OTP verification failed', status: 500 };
    }
  }

  /**
   * Initiates Google OAuth Sign-in.
   */
  static async signInWithGoogle(): Promise<void> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:8085';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/login`, // Redirect back to login page to handle session detection
      },
    });
  }

  /**
   * Sends a 6-digit OTP SMS code to the specified phone number.
   * Format: E.164 (e.g., +91XXXXXXXXXX)
   */
  static async sendOTP(phoneNumber: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'OTP dispatch failed', status: 500 };
    }
  }

  /**
   * Verifies the SMS token code sent to the phone number.
   * Signs the user in and establishes an active JWT session.
   */
  static async verifyOTP(phoneNumber: string, token: string): Promise<ApiResponse<{ userId: string; isNewUser: boolean }>> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: token,
        type: 'sms',
      });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      const userId = data.user?.id;
      if (!userId) {
        return { data: null, error: 'User session not found', status: 400 };
      }

      // Check if profile exists to determine if they are a new sign-up
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();

      const isNewUser = !profile || !profile.role;

      return {
        data: { userId, isNewUser },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'OTP verification failed', status: 500 };
    }
  }

  /**
   * Loads the user's public profile data from the public schema profiles table.
   */
  static async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as Profile, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Profile fetch failed', status: 500 };
    }
  }

  /**
   * Upserts the user's name and role during the Setup Onboarding step.
   */
  static async createProfile(
    userId: string,
    fullName: string,
    role: UserRole,
    phoneNumber: string
  ): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          phone_number: phoneNumber,
          full_name: fullName,
          role: role,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as Profile, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Profile setup failed', status: 500 };
    }
  }

  /**
   * Saves a delivery address for the user in the addresses table.
   */
  static async setupAddress(
    userId: string,
    label: string, // e.g. 'Home', 'Work'
    addressLine1: string,
    area: string,
    pincode: string,
    latitude: number,
    longitude: number,
    isDefault: boolean = true
  ): Promise<ApiResponse<boolean>> {
    try {
      // If default is selected, reset other default addresses first
      if (isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { error } = await supabase.from('addresses').insert({
        user_id: userId,
        label,
        address_line1: addressLine1,
        area,
        pincode,
        latitude,
        longitude,
        is_default: isDefault,
      });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Address save failed', status: 500 };
    }
  }

  /**
   * Signs the user out, clearing the secure persistent session token from the device.
   */
  static async signOut(): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { data: null, error: error.message, status: 400 };
      }
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Sign out failed', status: 500 };
    }
  }
}
