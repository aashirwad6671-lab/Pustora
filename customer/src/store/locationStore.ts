import { create } from 'zustand';
import { LocationState } from './index';
import { Store } from '../types';
import { supabase } from '../services/supabaseClient';

export const useLocationStore = create<LocationState>((set, get) => ({
  deliveryAddress: null,
  latitude: null,
  longitude: null,
  availableStores: [],
  nearestStore: null,
  distanceKm: null,

  setDeliveryAddress: (address: string, lat: number, lng: number) => {
    set({
      deliveryAddress: address,
      latitude: lat,
      longitude: lng,
    });
    // Trigger nearest store calculations
    get().calculateNearestStore();
  },

  fetchStores: async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        set({ availableStores: data as Store[] });
        get().calculateNearestStore();
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
      // fallback stores if query fails
      const fallbackStores: Store[] = [
        {
          id: 'store-hazratganj',
          name: 'Hazratganj Main Hub',
          address: 'Hazratganj, Lucknow',
          latitude: 26.8504,
          longitude: 80.9419,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'store-gomtinagar',
          name: 'Gomti Nagar Express',
          address: 'Gomti Nagar, Lucknow',
          latitude: 26.8624,
          longitude: 80.9987,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'store-aliganj',
          name: 'Aliganj Smart Depot',
          address: 'Aliganj, Lucknow',
          latitude: 26.8929,
          longitude: 80.9388,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      set({ availableStores: fallbackStores });
      get().calculateNearestStore();
    }
  },

  calculateNearestStore: () => {
    const { latitude, longitude, availableStores } = get();
    if (!latitude || !longitude || availableStores.length === 0) return;

    let minDistance = Infinity;
    let closestStore: Store | null = null;

    availableStores.forEach((store) => {
      const R = 6371; // km
      const dLat = ((store.latitude - latitude) * Math.PI) / 180;
      const dLng = ((store.longitude - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((store.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        closestStore = store;
      }
    });

    set({
      nearestStore: closestStore,
      distanceKm: parseFloat(minDistance.toFixed(1)),
    });
  },

  clearLocation: () => {
    set({
      deliveryAddress: null,
      latitude: null,
      longitude: null,
      nearestStore: null,
      distanceKm: null,
    });
  },
}));
