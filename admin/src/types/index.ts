// ==========================================
// PUSTORA ADMIN TYPES DEFINITION
// Kept in sync with mobile/src/types/index.ts
// ==========================================

export type UserRole = 'student' | 'parent' | 'teacher' | 'general' | 'admin';
export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

// 1. User Profile
export interface Profile {
  id: string; // UUID
  phone_number: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// 2. Lucknow Store Branch
export interface Store {
  id: string; // UUID
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 3. Product Category
export interface Category {
  id: string; // e.g. 'books', 'toys'
  name: string;
  emoji: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// 4. Catalog Product Detail
export interface Product {
  id: string; // UUID
  category_id: string;
  sub_category: string; // e.g. 'textbooks', 'notebooks'
  name: string;
  brand: string;
  description: string | null;
  price: number;
  mrp: number;
  stock_quantity: number;
  discount_percentage?: number; // Generated column
  grade_suitability: string | null; // e.g. 'Class 6'
  subject_tag: string | null; // e.g. 'Mathematics'
  image_url: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 5. Discount Coupon
export interface Coupon {
  id: string; // UUID
  code: string;
  discount_amount: number;
  min_cart_value: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// 6. Quick Commerce Order
export interface Order {
  id: string; // UUID
  user_id: string;
  store_id: string;
  status: OrderStatus;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  distance_km: number;
  items_total: number;
  delivery_fee: number;
  discount_applied: number;
  grand_total: number;
  payment_method: string; // 'COD' | 'UPI' | 'CARD'
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  created_at: string;
  updated_at: string;
}

// 7. Core Order Items list
export interface OrderItem {
  id: string; // UUID
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

// 8. Dynamic Configuration Settings
export interface SystemSettings {
  key: string;
  value: string;
  updated_at: string;
}

// 9. Product Feedback Reviews
export interface Review {
  id: string; // UUID
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// 10. Lucknow Saved Delivery Address
export interface Address {
  id: string; // UUID
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string | null;
  area: string;
  city?: string | null;
  state?: string | null;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}
