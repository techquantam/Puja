import { create } from 'zustand';
import { apiClient } from '../api/client';
import { useAuthStore } from './useAuthStore';

export interface ProductInCart {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
}

export interface ICartItem {
  _id: string;
  productId: ProductInCart;
  quantity: number;
}

export interface ICart {
  _id: string;
  userId: string;
  items: ICartItem[];
}

interface CartState {
  cart: ICart | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) return;

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get('/cart');
      set({ cart: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch cart', isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity: number = 1) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) return;

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/cart/add', { productId, quantity });
      set({ cart: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to add item', isLoading: false });
      throw err;
    }
  },

  updateQuantity: async (productId: string, quantity: number) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) return;

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.put('/cart/update', { productId, quantity });
      set({ cart: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update quantity', isLoading: false });
      throw err;
    }
  },

  removeFromCart: async (productId: string) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) return;

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.delete(`/cart/remove/${productId}`);
      set({ cart: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to remove item', isLoading: false });
      throw err;
    }
  },

  clearCart: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) return;

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.delete('/cart/clear');
      set({ cart: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to clear cart', isLoading: false });
      throw err;
    }
  },

  resetCart: () => {
    set({ cart: null, error: null, isLoading: false });
  },
}));
