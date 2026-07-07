import { create } from 'zustand';
import { CartState, CartItem } from './index';
import { Product, Coupon } from '../types';
import { OrderService } from '../services/orderService';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  appliedCoupon: null,
  deliveryCalculations: null,
  isLoading: false,

  getItemsTotal: () => {
    return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },

  getDiscountTotal: () => {
    const coupon = get().appliedCoupon;
    if (!coupon) return 0;
    const itemsTotal = get().getItemsTotal();
    if (itemsTotal < coupon.min_cart_value) return 0;
    return coupon.discount_amount;
  },

  getGrandTotal: () => {
    const itemsTotal = get().getItemsTotal();
    const discount = get().getDiscountTotal();
    const deliveryCalculations = get().deliveryCalculations;
    const deliveryFee = deliveryCalculations ? deliveryCalculations.deliveryFee : 0;
    return Math.max(0, itemsTotal - discount + deliveryFee);
  },

  addItem: (product: Product, quantity: number = 1) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((item) => item.product.id === product.id);

    let newItems = [...currentItems];
    if (existingIndex > -1) {
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity,
      };
    } else {
      newItems.push({ product, quantity });
    }

    set({ items: newItems });

    // Recalculate coupon eligibility if a coupon is active
    const coupon = get().appliedCoupon;
    if (coupon) {
      const itemsTotal = newItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
      if (itemsTotal < coupon.min_cart_value) {
        set({ appliedCoupon: null });
      }
    }
  },

  removeItem: (productId: string) => {
    const currentItems = get().items;
    const newItems = currentItems.filter((item) => item.product.id !== productId);
    set({ items: newItems });

    // Recalculate coupon eligibility
    const coupon = get().appliedCoupon;
    if (coupon) {
      const itemsTotal = newItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
      if (itemsTotal < coupon.min_cart_value) {
        set({ appliedCoupon: null });
      }
    }
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const currentItems = get().items;
    const newItems = currentItems.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );

    set({ items: newItems });

    // Recalculate coupon eligibility
    const coupon = get().appliedCoupon;
    if (coupon) {
      const itemsTotal = newItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
      if (itemsTotal < coupon.min_cart_value) {
        set({ appliedCoupon: null });
      }
    }
  },

  applyCoupon: async (code: string) => {
    set({ isLoading: true });
    try {
      const itemsTotal = get().getItemsTotal();
      const response = await OrderService.checkCouponCode(code, itemsTotal);

      if (response.error || !response.data) {
        set({ isLoading: false });
        return false;
      }

      set({ appliedCoupon: response.data, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  removeCoupon: () => {
    set({ appliedCoupon: null });
  },

  calculateDelivery: async (userLat: number, userLng: number) => {
    set({ isLoading: true });
    try {
      const response = await OrderService.calculateDeliveryCost(userLat, userLng);
      if (response.data) {
        set({ deliveryCalculations: response.data });
      }
    } catch (error) {
      console.error('Failed to calculate delivery fee:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: () => {
    set({
      items: [],
      appliedCoupon: null,
      deliveryCalculations: null,
    });
  },
}));
