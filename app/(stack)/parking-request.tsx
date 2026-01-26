import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parkingService } from '../../api/parking.service';
import { Button } from '../../components/ui/Button';
import { ImagePickerField } from '../../components/ui/ImagePickerField';
import { ImagePickerMulti } from '../../components/ui/ImagePickerMulti';
import { Input } from '../../components/ui/Input';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { geocodeAddress } from '../../utils/geocoding';

export default function ParkingRequestScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [geocodingLoading, setGeocodingLoading] = useState(false);

    // Form State
    const [parkingName, setParkingName] = useState('');
    const [capacity, setCapacity] = useState('');

    // Address
    const [locality, setLocality] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [pincode, setPincode] = useState('');

    // Location
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');

    // Map State
    const [region, setRegion] = useState({
        latitude: 20.5937, // Default to India center or generic
        longitude: 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
    });

    // Images
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!parkingName) newErrors.parkingName = 'Parking name is required';
        if (!capacity || parseInt(capacity) <= 0) newErrors.capacity = 'Valid capacity is required';
        if (!locality) newErrors.locality = 'Locality is required';
        if (!city) newErrors.city = 'City is required';
        if (!state) newErrors.state = 'State is required';
        if (!country) newErrors.country = 'Country is required';
        if (!pincode || pincode.length < 4) newErrors.pincode = 'Valid pincode is required';

        if (!lat) newErrors.lat = 'Latitude is required';
        if (!lng) newErrors.lng = 'Longitude is required';

        if (!mainImage) newErrors.mainImage = 'Main image is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLocateAddress = async () => {
        if (!locality && !city) {
            Alert.alert('Address Needed', 'Please enter at least Locality and City to find on map.');
            return;
        }

        const query = `${locality}, ${city}, ${state}, ${country}, ${pincode}`.replace(/, ,/g, ',');
        setGeocodingLoading(true);

        const coords = await geocodeAddress(query);
        setGeocodingLoading(false);

        if (coords) {
            setLat(coords.lat.toString());
            setLng(coords.lng.toString());
            setRegion({
                latitude: coords.lat,
                longitude: coords.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } else {
            Alert.alert('Not Found', 'Could not locate address on map. Please try refining the address or set pin manually.');
        }
    };

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setLat(latitude.toString());
        setLng(longitude.toString());
    };

    const handleSubmit = async () => {
        if (!validate()) {
            Alert.alert('Validation Error', 'Please check the form for errors.');
            return;
        }

        setLoading(true);

        try {
            // 1. Upload Main Image
            let mainImageUrl = '';
            if (mainImage) {
                // If it's already a remote URL (unlikely here but good practice), skip upload
                if (mainImage.startsWith('http')) {
                    mainImageUrl = mainImage;
                } else {
                    mainImageUrl = await uploadToCloudinary(mainImage);
                }
            }

            // 2. Upload Additional Images
            const additionalImageUrls = await Promise.all(
                additionalImages.map(async (uri) => {
                    if (uri.startsWith('http')) return uri;
                    return await uploadToCloudinary(uri);
                })
            );

            // 3. Submit Data
            const payload = {
                parkingName,
                capacity: parseInt(capacity),
                locality,
                city,
                state,
                country,
                pincode: parseInt(pincode),
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                mainimg: mainImageUrl,
                images: additionalImageUrls,
            };

            const response = await parkingService.submitParkingApproval(payload);

            if (response.success) {
                Alert.alert(
                    'Success',
                    'Parking request submitted successfully. Pending approval.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/(tabs)/profile' as any), // Redirect to profile or dashboard
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response.message || 'Failed to submit request.');
            }

        } catch (error: any) {
            console.error('Submission Error:', error);
            Alert.alert('Error', error.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-900">
                <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
                    <Ionicons name="arrow-back" size={24} color="#f97316" />
                </Button>
                <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 flex-1">
                    New Parking Request
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-4 py-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Section 1: Parking Details */}
                    <Text className="text-orange-500 font-semibold mb-4 uppercase text-xs tracking-wider">
                        Parking Details
                    </Text>

                    <Input
                        label="Parking Name"
                        placeholder="e.g. Downtown Plaza Parking"
                        value={parkingName}
                        onChangeText={setParkingName}
                        error={errors.parkingName}
                    />

                    <Input
                        label="Capacity (Vehicles)"
                        placeholder="e.g. 150"
                        value={capacity}
                        onChangeText={setCapacity}
                        keyboardType="numeric"
                        error={errors.capacity}
                    />

                    {/* Section 2: Address */}
                    <Text className="text-orange-500 font-semibold mt-4 mb-4 uppercase text-xs tracking-wider">
                        Address
                    </Text>
                    <Text className="text-xs text-gray-500 mb-2">
                        Enter address details then click coordinates below to auto-locate.
                    </Text>

                    <Input
                        label="Locality / Area"
                        placeholder="e.g. Central Business District"
                        value={locality}
                        onChangeText={setLocality}
                        error={errors.locality}
                    />

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Input
                                label="City"
                                placeholder="e.g. Metropolis"
                                value={city}
                                onChangeText={setCity}
                                error={errors.city}
                            />
                        </View>
                        <View className="flex-1">
                            <Input
                                label="State"
                                placeholder="e.g. NY"
                                value={state}
                                onChangeText={setState}
                                error={errors.state}
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Input
                                label="Country"
                                placeholder="e.g. USA"
                                value={country}
                                onChangeText={setCountry}
                                error={errors.country}
                            />
                        </View>
                        <View className="flex-1">
                            <Input
                                label="Pincode"
                                placeholder="e.g. 10001"
                                value={pincode}
                                onChangeText={setPincode}
                                keyboardType="numeric"
                                error={errors.pincode}
                            />
                        </View>
                    </View>

                    {/* Section 3: Location (Lat/Lng) */}
                    <View className="flex-row items-center justify-between mt-4 mb-4">
                        <Text className="text-orange-500 font-semibold uppercase text-xs tracking-wider">
                            Location Coordinates
                        </Text>
                        <Button
                            variant="primary"
                            size="sm"
                            label="Locate Address"
                            onPress={handleLocateAddress}
                            loading={geocodingLoading}
                            className="h-8"
                        />
                    </View>

                    {/* Map Component */}
                    <View className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-4 bg-gray-100 relative">
                        <MapView
                            region={region}
                            onRegionChangeComplete={setRegion}
                            style={{ width: '100%', height: '100%' }}
                            onPress={handleMapPress}
                            rotateEnabled={false}
                        >
                            <UrlTile
                                urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                maximumZ={19}
                                flipY={false}
                            />
                            {(lat && lng) ? (
                                <Marker
                                    coordinate={{ latitude: parseFloat(lat), longitude: parseFloat(lng) }}
                                    draggable
                                    onDragEnd={(e) => {
                                        setLat(e.nativeEvent.coordinate.latitude.toString());
                                        setLng(e.nativeEvent.coordinate.longitude.toString());
                                    }}
                                />
                            ) : null}
                        </MapView>

                        {!lat && (
                            <View className="absolute bottom-2 left-2 right-2 bg-black/60 p-2 rounded-lg">
                                <Text className="text-white text-center text-xs">
                                    Tap on map to set location pin
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Input
                                label="Latitude"
                                placeholder="e.g. 40.7128"
                                value={lat}
                                onChangeText={setLat}
                                keyboardType="numeric"
                                error={errors.lat}
                            />
                        </View>
                        <View className="flex-1">
                            <Input
                                label="Longitude"
                                placeholder="e.g. -74.0060"
                                value={lng}
                                onChangeText={setLng}
                                keyboardType="numeric"
                                error={errors.lng}
                            />
                        </View>
                    </View>

                    {/* Section 4: Images */}
                    <Text className="text-orange-500 font-semibold mt-4 mb-4 uppercase text-xs tracking-wider">
                        Images
                    </Text>

                    <ImagePickerField
                        label="Main Image (Required)"
                        imageUri={mainImage}
                        onImageSelected={setMainImage}
                        error={errors.mainImage}
                    />

                    <ImagePickerMulti
                        label="Additional Images"
                        images={additionalImages}
                        onImagesChange={setAdditionalImages}
                        maxImages={5}
                    />

                    {/* Submit */}
                    <Button
                        label="Submit for Approval"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        className="mt-6 mb-10"
                    />

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
