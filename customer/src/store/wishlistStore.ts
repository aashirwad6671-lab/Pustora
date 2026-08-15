import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types';

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        const current = get().items;
        if (!current.find((p) => p.id === product.id)) {
          set({ items: [...current, product] });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((p) => p.id !== productId) });
      },

      isInWishlist: (productId: string) => {
        return get().items.some((p) => p.id === productId);
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'pustora-wishlist',
    }
  )
);
