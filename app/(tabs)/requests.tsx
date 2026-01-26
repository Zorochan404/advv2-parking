import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { User } from '../../api/auth.service';
import { CarRequest, carRequestService } from '../../api/carRequest.service';
import { userService } from '../../api/user.service';
import { Container } from '../../components/layout/Container';
import { colors } from '../../theme/colors';

export default function CarVerificationScreen() {
    const router = useRouter();
    const [requests, setRequests] = useState<CarRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Details Modal State
    const [selectedRequest, setSelectedRequest] = useState<CarRequest | null>(null);
    const [userDetails, setUserDetails] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);

    // Deny Modal State
    const [denyVisible, setDenyVisible] = useState(false);
    const [denialReason, setDenialReason] = useState('');
    const [processing, setProcessing] = useState(false);


    console.log(selectedRequest)

    const fetchRequests = useCallback(async () => {
        console.log(selectedRequest)

        try {
            const data = await carRequestService.getAssignedRequests();
            console.log(userDetails)
            // Filter ensuring we only see 'PARKING_ASSIGNED'
            // The requirement says "Only show requests with status: PARKING_ASSIGNED"
            const relevant = data.filter(r => r.status === 'PARKING_ASSIGNED');
            setRequests(relevant);
        } catch (error) {
            console.error(error);
            // Optionally handle error (e.g. show toast)
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleOpenDetails = async (req: CarRequest) => {
        setSelectedRequest(req);
        setDetailsVisible(true);
        setUserLoading(true);
        try {
            const user = await userService.getUserById(req.vendorId);
            setUserDetails(user);
        } catch (error) {
            console.error("Failed to fetch user details", error);
            Alert.alert("Error", "Failed to fetch vendor details.");
        } finally {
            setUserLoading(false);
        }
    };

    const handleCloseDetails = () => {
        setDetailsVisible(false);
        setSelectedRequest(null);
        setUserDetails(null);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        Alert.alert(
            "Confirm Approval",
            "Are you sure you want to approve this car request?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve & Add Car",
                    style: "default",
                    onPress: async () => {
                        setDetailsVisible(false);
                        // Navigate to Add Car Details Form
                        // We pass necessary details to pre-fill the form
                        router.push({
                            pathname: '/(stack)/add-car-details',
                            params: {
                                requestId: selectedRequest.id,
                                vendorId: selectedRequest.vendorId,
                                parkingId: selectedRequest?.parkingId,
                                carName: selectedRequest.carName,
                                carNumber: selectedRequest.carNumber,
                                catalogId: selectedRequest?.catalogId,
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleDenyStart = () => {
        setDenialReason('');
        setDenyVisible(true);
    };

    const handleDenySubmit = async () => {
        if (!selectedRequest) return;
        if (!denialReason.trim()) {
            Alert.alert("Required", "Please provide a reason for denial.");
            return;
        }

        setProcessing(true);
        try {
            await carRequestService.denyRequest(selectedRequest.id, denialReason);
            Alert.alert("Descision Recorded", "Request denied successfully.");
            setDenyVisible(false);
            setDetailsVisible(false);
            fetchRequests(); // Refresh list
        } catch (error) {
            Alert.alert("Error", "Failed to deny request.");
        } finally {
            setProcessing(false);
        }
    };

    const renderItem = ({ item }: { item: CarRequest }) => (
        <TouchableOpacity
            onPress={() => handleOpenDetails(item)}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 shadow-sm border border-gray-100 dark:border-gray-700 flex-row items-center"
        >
            <View className="h-14 w-14 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4 overflow-hidden">
                {item.carImage ? (
                    <Image source={{ uri: item.carImage }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="w-full h-full items-center justify-center">
                        <Ionicons name="car-sport" size={24} color={colors.light.primary} />
                    </View>
                )}
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-bold text-base">{item.carName} <Text className="text-gray-500 font-normal">({item.carNumber})</Text></Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.vendorName}</Text>
                <Text className="text-xs text-gray-400 mt-2">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
            </View>
            <View>
                <View className="bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full">
                    <Text className="text-orange-600 dark:text-orange-300 text-xs font-bold">New</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <Container>
            <View className="pt-14 pb-4">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">Car Verification</Text>
                <Text className="text-gray-500 dark:text-gray-400">Review and verify assigned cars</Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.light.primary} />
                </View>
            ) : (
                <FlatList
                    className="flex-1"
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20">
                            <Ionicons name="car-sport-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-400 mt-4 text-center">No cars pending verification</Text>
                        </View>
                    }
                />
            )}

            {/* Request Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsVisible}
                onRequestClose={handleCloseDetails}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-gray-900 rounded-t-3xl h-[85%] p-6">
                        {/* Handle Bar */}
                        <View className="items-center mb-6">
                            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </View>

                        {selectedRequest && (
                            <View className="flex-1">
                                <View className="flex-row justify-between items-start mb-6">
                                    <View>
                                        <Text className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRequest.carName}</Text>
                                        <Text className="text-gray-500 text-lg">{selectedRequest.carCategory} • {selectedRequest.carNumber}</Text>
                                    </View>
                                    <TouchableOpacity onPress={handleCloseDetails} className="bg-gray-100 p-2 rounded-full">
                                        <Ionicons name="close" size={24} color="black" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView className="flex-1 my-2" showsVerticalScrollIndicator={false}>
                                    {/* Car Image */}
                                    <View className="h-48 w-full bg-gray-100 rounded-xl mb-6 overflow-hidden">
                                        {selectedRequest.carImage ? (
                                            <Image source={{ uri: selectedRequest.carImage }} className="w-full h-full" resizeMode="cover" />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center">
                                                <Ionicons name="image" size={48} color="gray" />
                                            </View>
                                        )}
                                    </View>

                                    {/* Vendor Details */}
                                    <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-4">
                                        <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-2">Vendor Details</Text>

                                        {userLoading ? (
                                            <ActivityIndicator size="small" color={colors.light.primary} />
                                        ) : userDetails ? (
                                            <View>
                                                <View className="flex-row items-center gap-3 mb-3">
                                                    <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                        {userDetails.avatar ? (
                                                            <Image source={{ uri: userDetails.avatar }} className="w-full h-full" />
                                                        ) : (
                                                            <View className="w-full h-full items-center justify-center bg-gray-300">
                                                                <Ionicons name="person" size={20} color="gray" />
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View>
                                                        <Text className="text-gray-900 dark:text-white font-bold text-base">{userDetails.name}</Text>
                                                        <Text className="text-gray-500 text-xs">ID: {userDetails.id}</Text>
                                                    </View>
                                                </View>

                                                <View className="space-y-2">
                                                    <View className="flex-row items-center gap-3">
                                                        <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center">
                                                            <Ionicons name="mail" size={12} color="#2563eb" />
                                                        </View>
                                                        <Text className="text-gray-900 dark:text-white text-sm">{userDetails.email}</Text>
                                                    </View>
                                                    <View className="flex-row items-center gap-3">
                                                        <View className="w-6 h-6 bg-green-100 rounded-full items-center justify-center">
                                                            <Ionicons name="call" size={12} color="#16a34a" />
                                                        </View>
                                                        <Text className="text-gray-900 dark:text-white text-sm">{userDetails.number}</Text>
                                                    </View>
                                                    <View className="flex-row items-center gap-3">
                                                        <View className="w-6 h-6 bg-purple-100 rounded-full items-center justify-center">
                                                            <Ionicons name="shield-checkmark" size={12} color="#9333ea" />
                                                        </View>
                                                        <Text className="text-gray-900 dark:text-white text-sm">
                                                            {userDetails.isverified ? "Verified Vendor" : "Unverified"}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ) : (
                                            <Text className="text-gray-500 italic">Vendor details unavailable</Text>
                                        )}
                                        {/* Documents */}
                                        {userDetails && (userDetails.aadharimg || userDetails.dlimg || userDetails.passportimg) && (
                                            <View className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                                <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-3">Documents</Text>
                                                <FlatList
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    data={[
                                                        { title: 'Aadhar', img: userDetails.aadharimg },
                                                        { title: 'DL', img: userDetails.dlimg },
                                                        { title: 'Passport', img: userDetails.passportimg }
                                                    ].filter(doc => doc.img)}
                                                    keyExtractor={(item) => item.title}
                                                    renderItem={({ item }) => (
                                                        <View className="mr-4">
                                                            <View className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden mb-1">
                                                                <Image source={{ uri: item.img }} className="w-full h-full" resizeMode="cover" />
                                                            </View>
                                                            <Text className="text-center text-xs text-gray-400">{item.title}</Text>
                                                        </View>
                                                    )}
                                                />
                                            </View>
                                        )}
                                    </View>

                                    <View className="mb-6">
                                        <Text className="text-gray-500 text-xs mb-1">Requested On</Text>
                                        <Text className="text-gray-900 dark:text-white font-medium">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}</Text>
                                    </View>
                                </ScrollView>

                                {/* Actions */}
                                <View className="pt-4 border-t border-gray-100 dark:border-gray-800 flex-row gap-4">
                                    <TouchableOpacity
                                        onPress={handleDenyStart}
                                        className="flex-1 bg-red-50 dark:bg-red-900/20 py-4 rounded-xl items-center border border-red-100 dark:border-red-900"
                                    >
                                        <Text className="text-red-500 font-bold text-lg">Deny</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleApprove}
                                        disabled={processing}
                                        className="flex-1 bg-green-500 py-4 rounded-xl items-center shadow-md"
                                    >
                                        {processing ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-bold text-lg">Approve</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Deny Reason Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={denyVisible}
                onRequestClose={() => setDenyVisible(false)}
            >
                <View className="flex-1 bg-black/60 justify-center px-6">
                    <View className="bg-white dark:bg-gray-800 rounded-2xl p-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">Deny Request</Text>
                        <Text className="text-gray-500 dark:text-gray-400 mb-4">Please provide a reason for denying this request.</Text>

                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 min-h-[100px] text-gray-900 dark:text-white mb-4"
                            multiline
                            placeholder="Reason for denial..."
                            placeholderTextColor="#9ca3af"
                            value={denialReason}
                            onChangeText={setDenialReason}
                            textAlignVertical="top"
                        />

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity onPress={() => setDenyVisible(false)} className="px-4 py-2">
                                <Text className="text-gray-500 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleDenySubmit}
                                disabled={processing}
                                className="bg-red-500 px-6 py-2 rounded-lg"
                            >
                                {processing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text className="text-white font-bold">Submit Denial</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </Container>
    );
}
