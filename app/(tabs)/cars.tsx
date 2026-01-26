import { API_CONFIG } from "@/api/config";
import { ENDPOINTS } from "@/api/endpoints";
import CarCard from "@/components/ui/cardCard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function CarsScreen() {
    const router = useRouter();
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        try {
            // Using hardcoded parking ID 2 as per requirement
            const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.CARS.GET_BY_PARKING.replace(':id', '2')}`, {
                headers: API_CONFIG.getHeaders(),
            });
            const data = await response.json();
            if (data.success && data.data && data.data.data) {
                setCars(data.data.data);
            }
        } catch (error) {
            console.error("Error fetching cars:", error);
        } finally {
            setLoading(false);
        }
    };

    const mapToCarRequest = (car: any) => {
        return {
            id: car.id,
            carName: car.name,
            carImage: car.images && car.images.length > 0 ? car.images[0] : "",
            carCategory: "", // Not present in response
            carNumber: car.number,
            vendorName: "", // vendorid is present but not name
            vendorContact: "",
            vendorId: car.vendorid,
            requestDate: car.createdAt,
            status: car.status,
            createdAt: new Date(car.createdAt),
        };
    };

    return (
        <View className="flex-1  px-4">
            <Text className="text-2xl font-bold mb-4">Cars</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#ffffff" />
            ) : (
                <>
                    <Text className="text-2xl text-white font-bold mb-4">Cars</Text>
                    <FlatList
                        data={cars}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <CarCard
                                id={item.id}
                                images={item.images || []}
                                carName={item.name}
                                maker={item.maker}
                                price={item.price}
                                discountprice={item.discountprice}
                                priceLabel={item.priceLabel || "day"}
                                popular={item.popular}
                                seats={item.seats}
                                transmission={item.transmission}
                                fuel={item.fuel}
                                parkingName={item.parkingName}
                                parkingLocation={item.parkingLocation}
                                parkingCity={item.parkingCity}
                                parkingDistance={item.parkingDistance}
                                onPress={() => router.push(`/car/${item.id}` as any)}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerClassName="pb-4"
                    />
                </>
            )}
        </View>
    );
}