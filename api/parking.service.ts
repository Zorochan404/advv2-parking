import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export interface ParkingApprovalRequest {
    parkingName: string;
    locality: string;
    city: string;
    state: string;
    country: string;
    pincode: number;
    capacity: number;
    mainimg: string; // Cloudinary URL
    images: string[]; // Cloudinary URLs
    lat: number;
    lng: number;
}

export interface ParkingApprovalResponse {
    success: boolean;
    message: string;
    data?: any; // Adjust if backend returns specific data
}

export const parkingService = {
    submitParkingApproval: async (payload: ParkingApprovalRequest): Promise<ParkingApprovalResponse> => {
        const response = await apiClient.post<ParkingApprovalResponse>(
            ENDPOINTS.PARKING.SUBMIT_APPROVAL,
            payload
        );
        console.log(response);
        return response.data;
    },
};
