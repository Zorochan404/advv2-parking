import { carRequestService } from '@/api/carRequest.service';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { carService } from '../../api/car.service';
import { Container } from '../../components/layout/Container';
import { colors } from '../../theme/colors';
import { uploadToCloudinary } from '../../utils/cloudinary';

export default function AddCarDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { vendorId, parkingId, carName: initialCarName, carNumber: initialCarNumber, requestId, catalogId } = params;

    const [form, setForm] = useState({
        name: (initialCarName as string) || '',
        color: '',
        carnumber: (initialCarNumber as string) || '',
        rcnumber: '',
    });

    const [images, setImages] = useState({
        rcimg: null as string | null,
        pollutionimg: null as string | null,
        insuranceimg: null as string | null,
        carImages: [] as string[],
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const pickImage = async (key: 'rcimg' | 'pollutionimg' | 'insuranceimg') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImages(prev => ({ ...prev, [key]: result.assets[0].uri }));
        }
    };

    const pickCarImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(a => a.uri);
            setImages(prev => ({ ...prev, carImages: [...prev.carImages, ...newUris] }));
        }
    };

    const removeCarImage = (index: number) => {
        setImages(prev => ({
            ...prev,
            carImages: prev.carImages.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!form.name || !form.carnumber || !form.rcnumber || !images.rcimg) {
            Alert.alert("Missing Fields", "Please fill in all required fields and upload RC image.");
            return;
        }

        setLoading(true);
        try {
            // 1. Upload Images
            const uploadPromises = [];

            // RC
            if (images.rcimg && !images.rcimg.startsWith('http')) uploadPromises.push(uploadToCloudinary(images.rcimg));
            else uploadPromises.push(Promise.resolve(images.rcimg || ""));

            // Pollution
            if (images.pollutionimg && !images.pollutionimg.startsWith('http')) uploadPromises.push(uploadToCloudinary(images.pollutionimg));
            else uploadPromises.push(Promise.resolve(images.pollutionimg || ""));

            // Insurance
            if (images.insuranceimg && !images.insuranceimg.startsWith('http')) uploadPromises.push(uploadToCloudinary(images.insuranceimg));
            else uploadPromises.push(Promise.resolve(images.insuranceimg || ""));

            // Car Images
            const carImgPromises = images.carImages.map(uri =>
                uri.startsWith('http') ? Promise.resolve(uri) : uploadToCloudinary(uri)
            );

            const [rcUrl, pollutionUrl, insuranceUrl] = await Promise.all(uploadPromises);
            const uploadedCarImages = await Promise.all(carImgPromises);

            const payload = {
                name: form.name,
                number: form.carnumber,
                vendorid: Number(vendorId),
                parkingid: Number(parkingId),
                color: form.color,
                rcnumber: form.rcnumber,
                rcimg: rcUrl,
                pollutionimg: pollutionUrl,
                insuranceimg: insuranceUrl,
                images: uploadedCarImages,
                catalogId: Number(catalogId),
                status: "unavailable" // As per requirement, though user said "dont add status: unavailable in form" - implicitly means payload needs it but user shouldn't edit it.
            };


            console.log("Submitting Payload:", payload);
            const response = await carService.addCar(payload);
            console.log("Response:", response);
            if (response.success === true) {
                const carId = response.data.id;
                if (!carId) {
                    Alert.alert("Error", "Car ID not found. Please try again.");
                    return;
                }
                console.log(`[AddCar] Starting approveRequest with requestId: ${requestId}, carId: ${carId}`);
                console.log(`[AddCar] Types - requestId: ${typeof requestId}, carId: ${typeof carId}`);

                try {
                    const submitrequest = await carRequestService.approveRequest(Number(requestId), Number(carId));
                    console.log("[AddCar] approveRequest success. Response:", submitrequest);

                    Alert.alert("Success", "Car added to fleet successfully!", [
                        { text: "OK", onPress: () => router.dismissTo('/(tabs)/requests') }
                    ]);
                    setLoading(false);
                } catch (approveError) {
                    console.error("[AddCar] approveRequest failed:", approveError);
                    Alert.alert("Error", "Car added but failed to approve request. Please contact support.");
                    setLoading(false);
                }
            } else {
                Alert.alert("Error", "Failed to add car. Please try again.");
                setLoading(false);
            }





        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to add car. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Container>
            <View className="pt-12 pb-4 px-4 border-b border-gray-100 dark:border-gray-800 flex-row items-center gap-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Ionicons name="arrow-back" size={24} color={colors.light.text} />
                </TouchableOpacity>
                <View>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Add Car Details</Text>
                    <Text className="text-gray-500 text-xs">Complete details to onboard car</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Section: Basic Info */}
                <Text className="section-title text-gray-900 dark:text-gray-100 font-bold mb-4">Basic Information</Text>
                <FormInput label="Car Name" value={form.name} onChangeText={(t: string) => handleInputChange('name', t)} placeholder="e.g. Toyota Innova" />
                <View className="flex-row gap-4">
                    <FormInput containerStyle="flex-1" label="Car Number" value={form.carnumber} onChangeText={(t: string) => handleInputChange('carnumber', t)} placeholder="MH 12 AB 1234" />
                    <FormInput containerStyle="flex-1" label="Color" value={form.color} onChangeText={(t: string) => handleInputChange('color', t)} placeholder="White" />
                </View>

                {/* Section: Documents */}
                <Text className="section-title mt-6 text-gray-900 dark:text-gray-100 font-bold mb-4">Documents & Images</Text>
                <FormInput label="RC Number" value={form.rcnumber} onChangeText={(t: string) => handleInputChange('rcnumber', t)} placeholder="RC123456789" />

                <View className="flex-row gap-4 mb-4">
                    <ImageUploadBox label="RC Image" imageUri={images.rcimg} onPress={() => pickImage('rcimg')} />
                    <ImageUploadBox label="Insurance" imageUri={images.insuranceimg} onPress={() => pickImage('insuranceimg')} />
                </View>
                <View className="flex-row gap-4 mb-4">
                    <ImageUploadBox label="Pollution" imageUri={images.pollutionimg} onPress={() => pickImage('pollutionimg')} />
                    {/* Placeholder for alignment if needed, or remove */}
                    <View className="flex-1" />
                </View>

                <Text className="label mb-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Car Images (Max 5)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    <TouchableOpacity onPress={pickCarImages} className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-xl items-center justify-center border border-dashed border-gray-300 mr-3">
                        <Ionicons name="add" size={32} color="gray" />
                        <Text className="text-xs text-gray-400 mt-1">Add Photos</Text>
                    </TouchableOpacity>
                    {images.carImages.map((uri, index) => (
                        <View key={index} className="w-24 h-24 rounded-xl overflow-hidden mr-3 relative">
                            <Image source={{ uri }} className="w-full h-full" />
                            <TouchableOpacity onPress={() => removeCarImage(index)} className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
                                <Ionicons name="close" size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-orange-500 py-4 rounded-xl items-center shadow-lg mb-10"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Add to Fleet</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </Container>
    );
}

// Components for cleaner code
const FormInput = ({ label, value, onChangeText, placeholder, keyboardType, multiline, containerStyle }: any) => (
    <View className={`mb-4 ${containerStyle}`}>
        <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-2 uppercase">{label}</Text>
        <TextInput
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            keyboardType={keyboardType}
            multiline={multiline}
        />
    </View>
);

const ImageUploadBox = ({ label, imageUri, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className="flex-1">
        <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-2 uppercase">{label}</Text>
        <View className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-dashed border-gray-300 dark:border-gray-700 items-center justify-center">
            {imageUri ? (
                <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <Ionicons name="cloud-upload-outline" size={24} color="gray" />
            )}
        </View>
    </TouchableOpacity>
);
