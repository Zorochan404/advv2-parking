import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_CONFIG } from './config';

const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Get token from Zustand store (or SecureStore if persisted)
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

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Handle global errors here (e.g., 401 Unauthorized -> Logout)
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default apiClient;
