import { useAuthStore } from "@/store/authStore";

export const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://7e720107c12a.ngrok-free.app/api/v1',
    TIMEOUT: 10000,
    HEADERS: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    getHeaders: () => {
        const token = useAuthStore.getState().accessToken;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
};
