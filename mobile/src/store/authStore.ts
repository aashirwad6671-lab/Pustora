import { create } from 'zustand';
import { AuthState } from './index';
import { AuthService } from '../services/authService';
import { Profile } from '../types';

// React Native Client Authentication State Store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setSession: (user: Profile, token: string) => {
    set({
      user,
      sessionToken: token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  updateProfile: async (profileUpdates: Partial<Profile>) => {
    const currentUser = get().user;
    if (!currentUser) {
      set({ error: 'Session profile not active' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // Upsert profile changes in public.profiles using structural service layers
      const response = await AuthService.createProfile(
        currentUser.id,
        profileUpdates.full_name || currentUser.full_name || '',
        profileUpdates.role || currentUser.role,
        currentUser.phone_number
      );

      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      if (response.data) {
        set({ user: response.data, isLoading: false });
      }
    } catch (err: any) {
      set({
        error: err.message || 'Failed to update profile information',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.signOut();
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      // Reset auth parameters on local hook states
      set({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({ error: err.message || 'Logout process failed', isLoading: false });
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
}));
