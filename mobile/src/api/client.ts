import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// In Expo development, localhost is usually not reachable from the physical device or emulator directly.
// Android Emulator uses 10.0.2.2. iOS Simulator can use localhost.
// Replace with your local machine's IP (e.g., http://192.168.1.XX:5000/api) for testing on physical devices.
const BASE_URL = 'http://10.218.138.21:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to append authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401 Unauthorized
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refreshing is already in progress, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        if (!currentRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Request new tokens using standard fetch or raw axios to avoid interceptor loop
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken: currentRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

        // Save new tokens to Zustand Store and SecureStore
        await useAuthStore.getState().setTokens(accessToken, newRefreshToken);

        // Update authorization header and process waiting queue
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Logout user if refresh fails
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // Process general server error message
    const customError = {
      message: error.response?.data?.message || 'Something went wrong. Please try again.',
      status: error.response?.status || 500,
      originalError: error,
    };

    return Promise.reject(customError);
  }
);
