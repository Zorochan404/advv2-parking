import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export interface LoginRequest {
    identifier: string; // phone or email
    password: string;
    authMethod: 'password';
}

export interface User {
    id: string;
    name: string;
    email: string;
    number: string; // Unified with Phone
    phoneNumber?: string; // Keeping for backward compat if needed, or remove if unused. Requirement said "number".
    role?: string;
    isverified?: boolean; // Note: Payload uses 'isverified' (lowercase v), inconsistent with typical camelCase but matches payload req.

    // Profile Fields
    age?: number;
    avatar?: string;

    // Address
    city?: string;
    state?: string;
    country?: string;
    locality?: string;
    pincode?: number;

    // Documents
    aadharNumber?: string;
    aadharimg?: string;
    dlNumber?: string;
    dlimg?: string;
    passportNumber?: string;
    passportimg?: string;

    // Vendor Specific
    parkingid?: string | null;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
        isNewUser: boolean;
    };
}


export interface RegisterRequest {
    aadharNumber: string;
    aadharimg: string;
    age: number;
    avatar: string;
    city: string;
    country: string;
    dlNumber: string;
    dlimg: string;
    email: string;
    isverified: boolean;
    locality: string;
    name: string;
    number: string;
    passportNumber?: string;
    passportimg?: string;
    password: string;
    pincode: number;
    role: 'user' | 'vendor'; // or strict string
    state: string;
}

export const authService = {
    login: async (payload: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, payload);
        return response.data;
    },

    register: async (payload: RegisterRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.REGISTER, payload);

        return response.data;
    },
};
