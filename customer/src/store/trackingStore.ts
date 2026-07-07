import { create } from 'zustand';
import { TrackingState } from './index';
import { Order } from '../types';

export const useTrackingStore = create<TrackingState>((set, get) => ({
  activeOrders: [],
  focusedOrder: null,
  riderLatitude: null,
  riderLongitude: null,

  setActiveOrders: (orders: Order[]) => {
    set({ activeOrders: orders });
  },

  updateOrderStatusRealtime: (orderId: string, status: Order['status']) => {
    const currentOrders = get().activeOrders;
    const updatedOrders = currentOrders.map((order) =>
      order.id === orderId ? { ...order, status } : order
    );

    set({ activeOrders: updatedOrders });

    // Also update focused order if it's the same
    const focused = get().focusedOrder;
    if (focused && focused.id === orderId) {
      set({ focusedOrder: { ...focused, status } });
    }
  },

  updateRiderLocation: (lat: number, lng: number) => {
    set({
      riderLatitude: lat,
      riderLongitude: lng,
    });
  },

  setFocusedOrder: (order: Order | null) => {
    set({ focusedOrder: order });
  },
}));
