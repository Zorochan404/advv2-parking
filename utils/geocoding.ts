import axios from 'axios';

interface GeocodingResult {
    lat: string;
    lon: string;
    display_name: string;
}

export const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number } | null> => {
    try {
        const response = await axios.get<GeocodingResult[]>(
            'https://nominatim.openstreetmap.org/search',
            {
                params: {
                    q: query,
                    format: 'json',
                    limit: 1,
                },
                headers: {
                    'User-Agent': 'AdvParkingApp/1.0', // Nominatim requires a User-Agent
                },
            }
        );

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding Error:', error);
        return null;
    }
};
