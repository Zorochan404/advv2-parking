import { API_CONFIG } from '@/api/config';
import { ENDPOINTS } from '@/api/endpoints';
import { useRouter } from 'expo-router';
import {
    AlertTriangle,
    Calendar,
    Car,
    CheckCircle,
    MapPin
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

// --- Types ---
interface StatCardProps {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
}

interface DashboardData {
    parkingLot: {
        id: number;
        name: string;
        locality: string;
        city: string;
        state: string;
        capacity: number;
        mainimg: string;
        lat: number;
        lng: number;
    };
    stats: {
        totalCars: number;
        availableCars: number;
        bookedCars: number;
        maintenanceCars: number;
        pendingVerifications: number;
    };
    pendingOTPVerifications: any[];
    bookings: any[];
    cars: any[];
}

export default function DashboardScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);

    // OTP Verification State
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const [verifying, setVerifying] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.BOOKING.PIC_DASHBOARD}`, {
                headers: API_CONFIG.getHeaders(),
            });
            const json = await response.json();
            if (json.success && json.data) {
                setData(json.data);
            } else {
                console.error("Dashboard fetch failed:", json);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to fetch dashboard data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleOpenVerify = (bookingId: number) => {
        setSelectedBookingId(bookingId);
        setOtp('');
        setOtpModalVisible(true);
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            Alert.alert("Validation", "Please enter a valid 4-digit OTP");
            return;
        }

        setVerifying(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.BOOKING.CONFIRM_PICKUP}`, {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({
                    bookingId: selectedBookingId,
                    otpCode: otp
                })
            });
            const json = await response.json();

            if (response.ok && json.success) {
                Alert.alert("Success", "Car pickup confirmed successfully!");
                setOtpModalVisible(false);
                fetchDashboardData(); // Refresh data
            } else {
                Alert.alert("Error", json.message || "Failed to verify OTP");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong verifying OTP");
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    // Components
    const StatCard = ({ label, value, icon: Icon, color, bgColor }: StatCardProps) => (
        <View className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex-1 min-w-[45%] mb-3 mr-2">
            <View className={`p-2 rounded-lg self-start mb-3 ${bgColor}`}>
                <Icon size={20} color={color} />
            </View>
            <Text className="text-3xl font-bold text-white mb-1">{value}</Text>
            <Text className="text-gray-400 text-xs font-medium">{label}</Text>
        </View>
    );

    const VerificationItem = ({ item }: { item: any }) => (
        <View className="bg-gray-900 p-4 rounded-xl border border-l-4 border-yellow-500 mb-3 ml-1 mr-1">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-3">
                    <Image
                        source={{ uri: item.user?.avatar || 'https://via.placeholder.com/40' }}
                        className="w-10 h-10 rounded-full bg-gray-700"
                    />
                    <View>
                        <Text className="text-white font-bold text-base">{item.user?.name}</Text>
                        <Text className="text-gray-400 text-xs text-yellow-500 font-medium">Needs Verification</Text>
                    </View>
                </View>
                <View className="bg-yellow-500/20 px-2 py-1 rounded">
                    <Text className="text-yellow-500 text-xs font-bold font-mono">OTP: {item.otpCode}</Text>
                </View>
            </View>

            <View className="bg-black/30 p-3 rounded-lg flex-row gap-3 mb-3">
                <Image
                    source={{ uri: item.car?.images?.[0] || 'https://via.placeholder.com/60' }}
                    className="w-16 h-12 rounded bg-gray-700"
                    resizeMode="cover"
                />
                <View className="flex-1 justify-center">
                    <Text className="text-gray-200 font-bold">{item.car?.name}</Text>
                    <Text className="text-gray-500 text-xs">{item.car?.number}</Text>
                </View>
            </View>

            <TouchableOpacity
                className="bg-yellow-500 py-3 rounded-lg items-center"
                onPress={() => handleOpenVerify(item.id)}
            >
                <Text className="text-black font-bold">Verify OTP</Text>
            </TouchableOpacity>
        </View>
    );

    const BookingListItem = ({ item }: { item: any }) => (
        <View className="bg-gray-900 rounded-xl overflow-hidden mb-3 border border-gray-800 flex-row">
            <Image
                source={{ uri: item.car?.images?.[0] || 'https://via.placeholder.com/80' }}
                className="w-24 h-full bg-gray-800"
                resizeMode="cover"
            />
            <View className="flex-1 p-3">
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text className="text-white font-bold text-base">{item.car?.name}</Text>
                        <Text className="text-gray-400 text-xs">{item.car?.number}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded text-xs ${item.status === 'completed' ? 'bg-green-500/20' :
                        item.status === 'cancelled' ? 'bg-red-500/20' : 'bg-blue-500/20'
                        }`}>
                        <Text className={`text-[10px] font-bold capitalize ${item.status === 'completed' ? 'text-green-500' :
                            item.status === 'cancelled' ? 'text-red-500' : 'text-blue-500'
                            }`}>
                            {item.status?.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-center mt-1">
                    <View>
                        <Text className="text-gray-500 text-[10px] uppercase">Pickup</Text>
                        <Text className="text-gray-300 text-xs font-semibold">
                            {new Date(item.startDate).toLocaleDateString()}
                        </Text>
                        <Text className="text-gray-400 text-[10px]">
                            {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View className="w-8 h-[1px] bg-gray-700" />
                    <View className="items-end">
                        <Text className="text-gray-500 text-[10px] uppercase">Dropoff</Text>
                        <Text className="text-gray-300 text-xs font-semibold">
                            {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                        <Text className="text-gray-400 text-[10px]">
                            {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const CarListItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push(`/car/${item.id}` as any)}
            className="bg-gray-900 rounded-xl overflow-hidden mb-3 border border-gray-800 flex-row"
        >
            <Image
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/80' }}
                className="w-24 h-24 bg-gray-800"
                resizeMode="cover"
            />
            <View className="flex-1 p-3 justify-center">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-white font-bold text-base">{item.name}</Text>
                        <Text className="text-gray-400 text-xs mb-2">{item.number}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded text-xs ${item.status === 'available' ? 'bg-green-500/20' :
                        item.status === 'maintenance' ? 'bg-orange-500/20' : 'bg-red-500/20'
                        }`}>
                        <Text className={`text-[10px] font-bold capitalize ${item.status === 'available' ? 'text-green-500' :
                            item.status === 'maintenance' ? 'text-orange-500' : 'text-red-500'
                            }`}>
                            {item.status?.replace('_', ' ')}
                        </Text>
                    </View>
                </View>
                <Text className="text-orange-500 font-bold">₹{item.discountprice || item.price}<Text className="text-gray-500 text-xs font-normal"> / day</Text></Text>
            </View>
        </TouchableOpacity>
    );



    if (loading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#eab308" />
            </View>
        );
    }

    if (!data) return null;

    return (
        <View className="flex-1 bg-black">
            {/* Header Section */}
            <View className="relative h-64">
                <Image
                    source={{ uri: data.parkingLot.mainimg }}
                    className="w-full h-full absolute"
                    resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/60" />
                <View className="absolute bottom-0 w-full p-6">
                    <Text className="text-white text-2xl font-bold mb-1">{data.parkingLot.name}</Text>
                    <View className="flex-row items-center gap-1 mb-2">
                        <MapPin size={14} color="#9ca3af" />
                        <Text className="text-gray-300 text-sm">
                            {data.parkingLot.locality}, {data.parkingLot.city}
                        </Text>
                    </View>
                    <View className="flex-row gap-3">
                        <View className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                            <Text className="text-white text-xs font-bold">{data.parkingLot.capacity} Slots</Text>
                        </View>
                        <View className="bg-green-500/20 px-3 py-1 rounded-full backdrop-blur-md">
                            <Text className="text-green-400 text-xs font-bold">Open</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1 -mt-4 bg-black rounded-t-3xl"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eab308" />
                }
            >
                <View className="p-4 pt-8">
                    {/* Stats Grid */}
                    <Text className="text-white font-bold text-lg mb-4">Overview</Text>
                    <View className="flex-row flex-wrap justify-between">
                        <StatCard
                            label="Total Cars"
                            value={data.stats.totalCars}
                            icon={Car}
                            color="#3b82f6"
                            bgColor="bg-blue-500/20"
                        />
                        <StatCard
                            label="Available"
                            value={data.stats.availableCars}
                            icon={CheckCircle}
                            color="#22c55e"
                            bgColor="bg-green-500/20"
                        />
                        <StatCard
                            label="Booked"
                            value={data.stats.bookedCars}
                            icon={Calendar}
                            color="#eab308"
                            bgColor="bg-yellow-500/20"
                        />
                        <StatCard
                            label="Maintenance"
                            value={data.stats.maintenanceCars}
                            icon={AlertTriangle}
                            color="#ef4444"
                            bgColor="bg-red-500/20"
                        />
                    </View>

                    {/* Pending Verifications */}
                    {data.pendingOTPVerifications.length > 0 && (
                        <View className="mt-4">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-white font-bold text-lg">Pending Verifications</Text>
                                <View className="bg-yellow-500 px-2 py-1 rounded-full">
                                    <Text className="text-black text-xs font-bold">{data.stats.pendingVerifications}</Text>
                                </View>
                            </View>
                            {data.pendingOTPVerifications.map((item) => (
                                <VerificationItem key={item.id} item={item} />
                            ))}
                        </View>
                    )}


                    {/* Bookings List */}
                    {data.bookings && data.bookings.length > 0 && (
                        <View className="mt-6">
                            <Text className="text-white font-bold text-lg mb-4">All Bookings</Text>
                            {data.bookings.map((booking) => (
                                <BookingListItem key={booking.id} item={booking} />
                            ))}
                        </View>
                    )}

                    {/* Cars List */}
                    <View className="mt-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white font-bold text-lg">My Cars</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/cars')}>
                                <Text className="text-orange-500 text-sm">View All</Text>
                            </TouchableOpacity>
                        </View>
                        {data.cars.slice(0, 5).map((car) => (
                            <CarListItem key={car.id} item={car} />
                        ))}
                    </View>

                    <View className="h-20" />
                </View>
            </ScrollView>

            {/* OTP Verification Modal */}
            <Modal
                visible={otpModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setOtpModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-center items-center p-4">
                    <View className="bg-gray-900 w-full max-w-sm p-6 rounded-2xl border border-gray-800">
                        <Text className="text-white text-xl font-bold mb-4 text-center">Enter OTP</Text>
                        <Text className="text-gray-400 text-sm mb-6 text-center">
                            Please enter the 4-digit OTP provided by the user to confirm pickup.
                        </Text>

                        <TextInput
                            className="bg-black text-white text-center text-3xl font-bold p-4 rounded-xl border border-gray-700 tracking-widest mb-6"
                            value={otp}
                            onChangeText={(text: string) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 4))}
                            keyboardType="numeric"
                            maxLength={4}
                            placeholder="0000"
                            placeholderTextColor="#4b5563"
                            autoFocus
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setOtpModalVisible(false)}
                                className="flex-1 bg-gray-800 p-4 rounded-xl items-center"
                            >
                                <Text className="text-gray-400 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleVerifyOtp}
                                disabled={verifying}
                                className="flex-1 bg-yellow-500 p-4 rounded-xl items-center"
                            >
                                {verifying ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <Text className="text-black font-bold">Verify</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
