import { API_CONFIG } from '@/api/config';
import { ENDPOINTS } from '@/api/endpoints';
import { ImagePickerMulti } from '@/components/ui/ImagePickerMulti';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Edit2, Fuel, Gauge, MapPin, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// --- Types ---
interface Car {
    id: number;
    name: string;
    number: string;
    price: number;
    discountprice: number;
    color: string;
    rcnumber: string;
    rcimg: string;
    pollutionimg: string;
    insuranceimg: string;
    images: string[];
    vendorid: number;
    parkingid: number;
    status: string;
    category: string;
    insuranceamount: string;
    fineperhour: number;
    extensionperhour: number;
    maker: string;
    year: number;
    engineCapacity: string | null;
    mileage: string;
    features: string | null;
    transmission: string;
    fuel: string;
    seats: number;
    createdAt: string;
    updatedAt: string;
}

interface Parking {
    id: number;
    name: string;
    locality: string;
    city: string;
    state: string;
    country: string;
    pincode: number;
    capacity: number;
    mainimg: string;
    lat: number;
    lng: number;
}

interface FeatureData {
    car: Car;
    reviews: any[];
    parking: Parking[];
    avgRating: number;
    reviewsWithUsers: any[];
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: FeatureData;
    statusCode: number;
}

export default function CarDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FeatureData | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editNumber, setEditNumber] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editImages, setEditImages] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchCarDetails();
        }
    }, [id]);

    const fetchCarDetails = async () => {
        try {
            const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.CARS.GET_DETAILS.replace(':id', id as string)}`;
            const response = await fetch(url, { headers: API_CONFIG.getHeaders() });
            const json: ApiResponse = await response.json();

            if (json.success && json.data) {
                setData(json.data);
            } else {
                Alert.alert("Error", "Failed to load car details");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong fetching details");
        } finally {
            setLoading(false);
        }
    };

    const handleEditPress = () => {
        if (!data?.car) return;
        setEditNumber(data.car.number);
        setEditColor(data.car.color);
        setEditStatus(data.car.status);
        setEditImages(data.car.images || []);
        setIsEditModalVisible(true);
    };

    const handleSave = async () => {
        if (!editNumber.trim() || !editColor.trim()) {
            Alert.alert("Validation", "Please fill all fields");
            return;
        }

        setSaving(true);
        try {
            // Mock Upload Logic for new images (local URIs)
            // In a real app, iterate editImages, if !startsWith('http'), upload and get URL.
            // For now, we assume direct update or pre-uploaded URLs.
            // Note: Implementing real Cloudinary upload would require credentials and more logic.

            const payload = {
                number: editNumber,
                color: editColor,
                status: editStatus,
                images: editImages
            };

            const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.CARS.UPDATE.replace(':id', id as string)}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify(payload)
            });
            const json = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Car updated successfully");
                setIsEditModalVisible(false);
                fetchCarDetails(); // Refresh
            } else {
                Alert.alert("Error", json.message || "Failed to update car");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update car");
        } finally {
            setSaving(false);
        }
    };

    const renderImageItem = ({ item }: { item: string }) => (
        <Image
            source={{ uri: item }}
            style={{ width: width, height: 250 }}
            resizeMode="cover"
        />
    );

    if (loading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    if (!data?.car) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <Text className="text-white">Car not found</Text>
            </View>
        );
    }

    const { car, parking } = data;
    const parkingDetails = parking && parking.length > 0 ? parking[0] : null;

    return (
        <View className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-black z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-800 rounded-full">
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">Car Details</Text>
                <TouchableOpacity onPress={handleEditPress} className="p-2 bg-gray-800 rounded-full">
                    <Edit2 size={20} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Image Slider */}
                <View className="relative">
                    <FlatList
                        data={car.images}
                        renderItem={renderImageItem}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, index) => index.toString()}
                        onMomentumScrollEnd={(ev) => {
                            const newIndex = Math.round(ev.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(newIndex);
                        }}
                    />
                    {/* Pagination Dots */}
                    <View className="absolute bottom-4 flex-row w-full justify-center gap-2">
                        {car.images.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 w-2 rounded-full ${activeImageIndex === index ? 'bg-orange-500' : 'bg-white/50'}`}
                            />
                        ))}
                    </View>
                </View>

                {/* Content Container */}
                <View className="px-4 py-6 gap-6">

                    {/* Basic Info */}
                    <View>
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-orange-500 font-bold text-sm uppercase tracking-wide">{car.maker}</Text>
                                <Text className="text-3xl font-bold text-white mt-1">{car.name}</Text>
                            </View>
                            <View className={`px-3 py-1 rounded-full ${car.status === 'active' || car.status === 'available' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                <Text className={`text-xs font-bold capitalize ${car.status === 'active' || car.status === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                                    {car.status}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row mt-4 gap-4">
                            <View className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg">
                                <Users size={16} color="#9ca3af" />
                                <Text className="text-gray-300 ml-2">{car.seats} Seats</Text>
                            </View>
                            <View className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg">
                                <Gauge size={16} color="#9ca3af" />
                                <Text className="text-gray-300 ml-2 capitalize">{car.transmission}</Text>
                            </View>
                            <View className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg">
                                <Fuel size={16} color="#9ca3af" />
                                <Text className="text-gray-300 ml-2 capitalize">{car.fuel}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Pricing */}
                    <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                        <Text className="text-white font-bold text-lg mb-4">Pricing</Text>
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-gray-400">Daily Rate</Text>
                            <View className="items-end">
                                <Text className="text-orange-500 font-bold text-xl">₹{car.discountprice}</Text>
                                {car.price > car.discountprice && (
                                    <Text className="text-gray-500 text-xs line-through">₹{car.price}</Text>
                                )}
                            </View>
                        </View>
                        <View className="h-[1px] bg-gray-800 my-2" />
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-400">Extra hour charges</Text>
                            <Text className="text-white font-semibold">₹{car.fineperhour}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-2">
                            <Text className="text-gray-400">Extension per hour</Text>
                            <Text className="text-white font-semibold">₹{car.extensionperhour}</Text>
                        </View>
                    </View>

                    {/* Details Grid */}
                    <View>
                        <Text className="text-white font-bold text-lg mb-4">Specifications</Text>
                        <View className="flex-row flex-wrap justify-between">
                            <DetailItem label="Car Number" value={car.number} />
                            <DetailItem label="Color" value={car.color} />
                            <DetailItem label="Year" value={car.year.toString()} />
                            <DetailItem label="Mileage" value={`${car.mileage} kmpl`} />
                            <DetailItem label="Category" value={car.category} />
                            <DetailItem label="RC Number" value={car.rcnumber} />
                        </View>
                    </View>

                    {/* Documents */}
                    <View>
                        <Text className="text-white font-bold text-lg mb-4">Documents</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
                            <DocImage label="RC Card" uri={car.rcimg} />
                            <DocImage label="Pollution" uri={car.pollutionimg} />
                            <DocImage label="Insurance" uri={car.insuranceimg} />
                        </ScrollView>
                    </View>

                    {/* Parking Details */}
                    {parkingDetails && (
                        <View className="mb-8">
                            <Text className="text-white font-bold text-lg mb-4">Location</Text>
                            <View className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                                {parkingDetails.mainimg && (
                                    <Image source={{ uri: parkingDetails.mainimg }} className="w-full h-32" resizeMode="cover" />
                                )}
                                <View className="p-4">
                                    <Text className="text-white font-bold text-base">{parkingDetails.name}</Text>
                                    <View className="flex-row items-center mt-2">
                                        <MapPin size={16} color="#f97316" />
                                        <Text className="text-gray-400 ml-2 flex-1">
                                            {parkingDetails.locality}, {parkingDetails.city}, {parkingDetails.state}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View className="flex-1 bg-black">
                    <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-800">
                        <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                            <Text className="text-blue-500 font-medium">Cancel</Text>
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-lg">Edit Car</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator color="#f97316" /> : <Text className="text-orange-500 font-bold">Save</Text>}
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-4">
                        <View className="mb-4">
                            <Text className="text-gray-400 mb-2">Car Number</Text>
                            <TextInput
                                className="bg-gray-900 text-white p-4 rounded-xl border border-gray-800"
                                value={editNumber}
                                onChangeText={setEditNumber}
                                placeholder="Enter car number"
                                placeholderTextColor="#6b7280"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-gray-400 mb-2">Color</Text>
                            <TextInput
                                className="bg-gray-900 text-white p-4 rounded-xl border border-gray-800"
                                value={editColor}
                                onChangeText={setEditColor}
                                placeholder="Enter car color"
                                placeholderTextColor="#6b7280"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-400 mb-2">Status</Text>
                            <View className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                                <Picker
                                    selectedValue={editStatus}
                                    onValueChange={(itemValue) => setEditStatus(itemValue)}
                                    dropdownIconColor="white"
                                    style={{ color: 'white', backgroundColor: 'transparent' }}
                                >
                                    <Picker.Item label="Available" value="available" />
                                    <Picker.Item label="Maintenance" value="maintenance" />
                                    <Picker.Item label="Unavailable" value="unavailable" />
                                    <Picker.Item label="Out of Service" value="out_of_service" />
                                </Picker>
                            </View>
                        </View>

                        <ImagePickerMulti
                            label="Car Images"
                            images={editImages}
                            onImagesChange={(imgs) => setEditImages(imgs)}
                            maxImages={5}
                            className="bg-gray-900 p-4 rounded-xl border border-gray-800"
                        />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <View className="w-[48%] bg-gray-900 p-3 rounded-xl mb-3 border border-gray-800">
        <Text className="text-gray-500 text-xs mb-1">{label}</Text>
        <Text className="text-white font-semibold" numberOfLines={1}>{value}</Text>
    </View>
);

const DocImage = ({ label, uri }: { label: string, uri: string }) => (
    <View className="mr-4">
        <Image
            source={{ uri: uri || 'https://via.placeholder.com/150' }}
            className="w-32 h-24 rounded-lg bg-gray-800"
            resizeMode="cover"
        />
        <Text className="text-gray-400 text-xs mt-2 text-center">{label}</Text>
    </View>
);
