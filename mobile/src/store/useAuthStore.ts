import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  isVerified: boolean;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserProfile, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<UserProfile>) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const SECURE_STORE_USER_KEY = 'pujamart_user';
const SECURE_STORE_ACCESS_KEY = 'pujamart_access_token';
const SECURE_STORE_REFRESH_KEY = 'pujamart_refresh_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user, accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(SECURE_STORE_USER_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(SECURE_STORE_ACCESS_KEY, accessToken);
      await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error saving auth tokens:', error);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_USER_KEY);
      await SecureStore.deleteItemAsync(SECURE_STORE_ACCESS_KEY);
      await SecureStore.deleteItemAsync(SECURE_STORE_REFRESH_KEY);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error deleting auth tokens:', error);
    }
  },

  updateUser: (updatedFields) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedFields };
      SecureStore.setItemAsync(SECURE_STORE_USER_KEY, JSON.stringify(newUser));
      set({ user: newUser });
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(SECURE_STORE_ACCESS_KEY, accessToken);
      await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, refreshToken);
      set({ accessToken, refreshToken });
    } catch (error) {
      console.error('Error setting updated tokens:', error);
    }
  },

  initializeAuth: async () => {
    try {
      const userStr = await SecureStore.getItemAsync(SECURE_STORE_USER_KEY);
      const accessToken = await SecureStore.getItemAsync(SECURE_STORE_ACCESS_KEY);
      const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_REFRESH_KEY);

      if (userStr && accessToken && refreshToken) {
        set({
          user: JSON.parse(userStr),
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
      set({ isLoading: false });
    }
  },
}));
