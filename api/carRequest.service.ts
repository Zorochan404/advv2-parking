import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export interface CarRequest {
    id: number;
    carName: string;
    carImage: string; // Assuming single image for list, or first of images
    carCategory: string;
    carNumber: string;
    vendorName: string;
    vendorContact: string;
    vendorId: number;
    requestDate: string; // ISO string
    status: 'PENDING' | 'PARKING_ASSIGNED' | 'APPROVED' | 'DENIED';
    parkingId?: number;
    parkingName?: string;
    catalogId?: number;
    createdAt?: Date;
}

export interface DenialPayload {
    denialreason: string;
}

export const carRequestService = {
    getAssignedRequests: async (): Promise<CarRequest[]> => {
        const response = await apiClient.get<any>(ENDPOINTS.CAR_REQUEST.GET_ASSIGNED, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (Array.isArray(response.data.data.data)) {
            console.log(response.data.data.data);
            return response.data.data.data;
        }

        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        console.warn('Unexpected API response structure for assigned requests:', response.data.data.data);
        return [];
    },

    approveRequest: async (id: number, carId: number): Promise<any> => {
        const url = ENDPOINTS.CAR_REQUEST.APPROVE.replace(':id', id.toString());
        console.log(`[CarRequestService] approveRequest calling URL: ${url} with payload: { carid: ${carId} }`);
        try {
            const response = await apiClient.put(url, { carid: carId });
            console.log(`[CarRequestService] approveRequest response status: ${response.status}`);
            return response.data;
        } catch (error) {
            console.error(`[CarRequestService] approveRequest error:`, error);
            throw error;
        }
    },

    denyRequest: async (id: number, reason: string): Promise<any> => {
        const url = ENDPOINTS.CAR_REQUEST.DENY.replace(':id', id.toString());
        const payload: DenialPayload = { denialreason: reason };
        const response = await apiClient.put(url, payload);
        return response.data;
    },
};
