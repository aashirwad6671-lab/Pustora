// ==========================================
// PUSTORA ZUSTAND STATE MANAGEMENT STRUCTURE
// ==========================================

import { Profile, Product, Coupon, Store, Order } from '../types';
import { DeliveryCostCalculation } from '../services/api.types';

// ------------------------------------------
// 1. AUTHENTICATION STORE INTERFACE
// ------------------------------------------
export interface AuthState {
  // States
  user: Profile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (user: Profile, token: string) => void;
  updateProfile: (profileUpdates: Partial<Profile>) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// ------------------------------------------
// 2. SHOPPING CART STORE INTERFACE
// ------------------------------------------
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  // States
  items: CartItem[];
  appliedCoupon: Coupon | null;
  deliveryCalculations: DeliveryCostCalculation | null;
  isLoading: boolean;

  // Computed Values (Represented as selector functions)
  getItemsTotal: () => number;
  getDiscountTotal: () => number;
  getGrandTotal: () => number;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  calculateDelivery: (userLat: number, userLng: number) => Promise<void>;
  clearCart: () => void;
}

// ------------------------------------------
// 3. ROUTING & LOCATION STORE INTERFACE
// ------------------------------------------
export interface LocationState {
  // States
  deliveryAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  availableStores: Store[];
  nearestStore: Store | null;
  distanceKm: number | null;

  // Actions
  setDeliveryAddress: (address: string, lat: number, lng: number) => void;
  fetchStores: () => Promise<void>;
  calculateNearestStore: () => void;
  clearLocation: () => void;
}

// ------------------------------------------
// 4. NOTIFICATION & REAL-TIME DISPATCH STORE INTERFACE
// ------------------------------------------
export interface TrackingState {
  // States
  activeOrders: Order[];
  focusedOrder: Order | null;
  riderLatitude: number | null;
  riderLongitude: number | null;

  // Actions
  setActiveOrders: (orders: Order[]) => void;
  updateOrderStatusRealtime: (orderId: string, status: Order['status']) => void;
  updateRiderLocation: (lat: number, lng: number) => void;
  setFocusedOrder: (order: Order | null) => void;
}
