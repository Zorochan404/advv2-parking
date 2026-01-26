import { User } from './auth.service'; // Reuse User type
import apiClient from './client';
import { ENDPOINTS } from './endpoints';

interface UpdateResponse {
    success: boolean;
    message: string;
    data: User;
}

export const userService = {
    updateUserProfile: async (id: string, data: Partial<User>): Promise<UpdateResponse> => {
        // Construct the URL with ID
        const url = ENDPOINTS.USER.UPDATE.replace(':id', id) + '/' + id;
        // Note: The requirement said "Replace :id with the logged-in user’s id".
        // Example: {{base_url}}user/updateuser/:id
        // However, standard axios clients usually take the URL. 
        // If the endpoint in endpoints.ts is just '/user/updateuser', we need to append the ID.
        // Let's verify endpoints.ts content. It is '/user/updateuser'.
        // So I'll append `/${id}`. 
        const response = await apiClient.put<UpdateResponse>(`${ENDPOINTS.USER.UPDATE}/${id}`, data);
        return response.data;
    },

    getUserById: async (id: number): Promise<User> => {
        const response = await apiClient.get<{ success: boolean, data: User }>(`${ENDPOINTS.USER.GET_USER}/${id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log(response);
        return response.data.data;
    },
};
