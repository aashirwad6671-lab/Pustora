import { create } from 'zustand';
import { AuthState } from './index';
import { AuthService } from '../services/authService';
import { Profile } from '../types';
import { supabase } from '../services/supabaseClient';

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

  initializeAuthListener: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        AuthService.getProfile(session.user.id).then(res => {
          if (res.data) {
            set({ user: res.data, sessionToken: session.access_token, isAuthenticated: true });
          } else {
            // Handle case where profile isn't fully created yet (e.g. Google OAuth new user)
            const fallbackProfile: Profile = {
              id: session.user.id,
              phone_number: session.user.user_metadata?.phone_number || '',
              full_name: session.user.user_metadata?.full_name || '',
              role: 'general',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            set({ user: fallbackProfile, sessionToken: session.access_token, isAuthenticated: true });
          }
        });
      }
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const res = await AuthService.getProfile(session.user.id);
        if (res.data) {
          set({ user: res.data, sessionToken: session.access_token, isAuthenticated: true });
        } else {
          const fallbackProfile: Profile = {
            id: session.user.id,
            phone_number: session.user.user_metadata?.phone_number || '',
            full_name: session.user.user_metadata?.full_name || '',
            role: 'general',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ user: fallbackProfile, sessionToken: session.access_token, isAuthenticated: true });
        }
      } else {
        set({ user: null, sessionToken: null, isAuthenticated: false });
      }
    });
  },
}));
