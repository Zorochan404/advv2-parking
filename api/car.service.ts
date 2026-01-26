import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export interface AddCarPayload {
    name: string;
    number: string;
    vendorid: number;
    parkingid: number;
    color: string;
    rcnumber: string;
    rcimg: string;
    pollutionimg: string;
    insuranceimg: string;
    images: string[];
    catalogId: number;
    status: string;
}

export const carService = {
    addCar: async (payload: AddCarPayload) => {
        try {
            const response = await apiClient.post(ENDPOINTS.CARS.ADD, payload);
            return response.data;
        } catch (error) {
            console.error("Error adding car:", error);
            throw error;
        }
    }
};
