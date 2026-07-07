// ==========================================
// PUSTORA API STANDARD BOUNDARIES
// ==========================================

import { Profile, Product, Category, Order, Coupon, Store } from '../types';

/**
 * Standard unified response wrapper for all network API calls.
 * Ensures consistent handling of outcomes, payload, and descriptive errors across UI.
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// 1. Authentication Services Payload
export interface SessionResponse {
  user: Profile | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// 2. Location Calculation details
export interface DeliveryCostCalculation {
  distanceKm: number;
  isFreeDelivery: boolean;
  deliveryFee: number;
  nearestStoreId: string;
  nearestStoreName: string;
}

// 3. Product Catalog Queries
export interface ProductQueryFilters {
  categoryId?: string;
  subCategory?: string;
  gradeSuitability?: string;
  subjectTag?: string;
  brandName?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  isFeatured?: boolean;
}

// 4. Order Placements
export interface CheckoutRequest {
  items: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  paymentMethod: 'COD' | 'UPI' | 'CARD';
}

// 5. Razorpay Transaction details
export interface RazorpayOrderInit {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  receiptId: string;
}
