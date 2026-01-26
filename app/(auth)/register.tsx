import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { authService, RegisterRequest } from '../../api/auth.service';
import { Button } from '../../components/ui/Button';
import { ImagePickerField } from '../../components/ui/ImagePickerField';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface FormValues {
    name: string;
    email: string;
    number: string;
    password: string;
    age: string;
    aadharNumber: string;
    dlNumber: string;
    passportNumber: string;
    city: string;
    state: string;
    country: string;
    locality: string;
    pincode: string;
}

interface ImageUrls {
    avatar?: string;
    aadharimg?: string;
    dlimg?: string;
    passportimg?: string;
}

interface FormErrors {
    [key: string]: string;
}

export default function StaffSignupScreen() {
    const [formValues, setFormValues] = useState<FormValues>({
        name: '',
        email: '',
        number: '',
        password: '',
        age: '',
        aadharNumber: '',
        dlNumber: '',
        passportNumber: '',
        city: '',
        state: '',
        country: '',
        locality: '',
        pincode: '',
    });

    const [imageUrls, setImageUrls] = useState<ImageUrls>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // We handle upload loading state within the ImagePickerField component implicitly via the parent waiting? 
    // Actually the reference had explicit loading states. 
    // I will add explicit loading states for images to disable submit or show feedback if needed.
    // The ImagePickerField in this project seems to handle the picking, but the UPLOAD happens there?
    // Wait, the ImagePickerField emits `onImageSelected` with a LOCAL URI.
    // The previous implementation uploaded ALL images at the end.
    // The reference implementation uploads images IMMEDIATELY after picking.
    // I will follow the Reference approach: Upload immediately after picking to get the Cloudinary URL.

    const [uploadLoading, setUploadLoading] = useState({
        avatar: false,
        aadhar: false,
        dl: false,
        passport: false,
    });

    const login = useAuthStore((state) => state.login);

    const handleInputChange = (field: keyof FormValues, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleImagePickAndUpload = async (type: 'avatar' | 'aadhar' | 'dl' | 'passport', localUri: string) => {
        // This function is called when ImagePickerField returns a URI
        setUploadLoading(prev => ({ ...prev, [type]: true }));
        try {
            const cloudinaryUrl = await uploadToCloudinary(localUri);
            if (cloudinaryUrl) {
                setImageUrls(prev => ({
                    ...prev,
                    [type === 'aadhar' ? 'aadharimg' : type === 'dl' ? 'dlimg' : type === 'passport' ? 'passportimg' : 'avatar']: cloudinaryUrl
                }));
                // Clear error if exists
                const errorKey = type === 'aadhar' ? 'aadharimg' : type === 'dl' ? 'dlimg' : type === 'passport' ? 'passportimg' : 'avatar';
                if (errors[errorKey]) {
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[errorKey];
                        return newErrors;
                    });
                }
            } else {
                Alert.alert('Upload Failed', 'Could not upload image to cloud.');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            Alert.alert('Error', 'Failed to upload image.');
        } finally {
            setUploadLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    // Validation
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateMobile = (number: string) => /^\d{10}$/.test(number);
    const validateAge = (age: string) => {
        const num = parseInt(age, 10);
        return !isNaN(num) && num >= 18;
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        // Basic
        if (!formValues.name.trim()) newErrors.name = 'Name is required';
        if (!formValues.email.trim()) newErrors.email = 'Email is required';
        else if (!validateEmail(formValues.email)) newErrors.email = 'Invalid email';
        if (!formValues.number.trim()) newErrors.number = 'Mobile number is required';
        else if (!validateMobile(formValues.number)) newErrors.number = 'Invalid (10 digits)';
        if (!formValues.password.trim()) newErrors.password = 'Password is required';
        else if (formValues.password.length < 8) newErrors.password = 'Min 8 chars required';
        if (!formValues.age.trim()) newErrors.age = 'Age is required';
        else if (!validateAge(formValues.age)) newErrors.age = 'Must be 18+';

        // Address
        if (!formValues.city.trim()) newErrors.city = 'City is required';
        if (!formValues.state.trim()) newErrors.state = 'State is required';
        if (!formValues.country.trim()) newErrors.country = 'Country is required';
        if (!formValues.locality.trim()) newErrors.locality = 'Locality is required';
        if (!formValues.pincode.trim()) newErrors.pincode = 'Pincode is required';
        else if (!/^\d{6}$/.test(formValues.pincode.trim())) newErrors.pincode = 'Invalid Pincode (6 digits)';

        // Documents
        if (!formValues.aadharNumber.trim()) newErrors.aadharNumber = 'Aadhaar No. required';
        if (!imageUrls.aadharimg) newErrors.aadharimg = 'Aadhaar image required';

        if (!formValues.dlNumber.trim()) newErrors.dlNumber = 'DL No. required';
        if (!imageUrls.dlimg) newErrors.dlimg = 'DL image required';

        // Passport (Optional)
        // If provided number, ideally provide image, but keeping optional as per analysis.

        // Profile
        if (!imageUrls.avatar) newErrors.avatar = 'Profile image required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please check the form for errors.');
            return;
        }

        // Ensure all uploads are done
        if (Object.values(uploadLoading).some(l => l)) {
            Alert.alert('Please Wait', 'Images are still uploading...');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: RegisterRequest = {
                name: formValues.name.trim(),
                email: formValues.email.trim(),
                number: formValues.number.trim(),
                password: formValues.password,
                age: parseInt(formValues.age, 10),
                role: 'user',
                isverified: true,
                aadharNumber: formValues.aadharNumber.trim(),
                aadharimg: imageUrls.aadharimg!,
                dlNumber: formValues.dlNumber.trim(),
                dlimg: imageUrls.dlimg!,
                passportNumber: formValues.passportNumber.trim() || undefined,
                passportimg: imageUrls.passportimg || undefined,
                avatar: imageUrls.avatar!,
                city: formValues.city.trim(),
                state: formValues.state.trim(),
                country: formValues.country.trim(),
                locality: formValues.locality.trim(),
                pincode: Number(formValues.pincode.trim()),
            };

            const response = await authService.register(payload);
            console.log(response);
            if (response.success && response.data) {
                Alert.alert('Success', 'Registration successful!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            const { user, tokens } = response.data;
                            login(user, tokens.accessToken, tokens.refreshToken);
                            router.replace('/(tabs)');
                        }
                    }
                ]);
            } else {
                Alert.alert('Registration Failed', response.message || 'Unknown error');
            }
        } catch (error: any) {
            console.error('Registration Error:', error);
            Alert.alert('Error', error.message || 'Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-black">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="mb-6">
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={colors.light.text}
                            onPress={() => router.back()}
                            style={{ marginBottom: 16 }}
                        />
                        <Text className="text-3xl font-bold text-orange-500">
                            Parking incharge info
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 mt-2">
                            Create your vendor account to start.
                        </Text>
                    </View>

                    {/* Basic Info */}
                    <View className="bg-white dark:bg-gray-900 p-4 rounded-xl mb-4 shadow-sm">
                        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Basic Information</Text>

                        <Input
                            label="Full Name *"
                            placeholder="Ex. John Doe"
                            value={formValues.name}
                            onChangeText={v => handleInputChange('name', v)}
                            error={errors.name}
                        />
                        <Input
                            label="Email *"
                            placeholder="Ex. john@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formValues.email}
                            onChangeText={v => handleInputChange('email', v)}
                            error={errors.email}
                        />
                        <Input
                            label="Mobile Number *"
                            placeholder="10-digit number"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={formValues.number}
                            onChangeText={v => handleInputChange('number', v)}
                            error={errors.number}
                        />
                        <Input
                            label="Password *"
                            placeholder="Min 8 characters"
                            secureTextEntry
                            value={formValues.password}
                            onChangeText={v => handleInputChange('password', v)}
                            error={errors.password}
                        />
                        <View className="flex-row gap-4">
                            <Input
                                label="Age *"
                                placeholder="Age"
                                keyboardType="numeric"
                                containerClassName="flex-1"
                                value={formValues.age}
                                onChangeText={v => handleInputChange('age', v)}
                                error={errors.age}
                            />

                        </View>
                    </View>

                    {/* Address Details */}
                    <View className="bg-white dark:bg-gray-900 p-4 rounded-xl mb-4 shadow-sm">
                        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Address Details</Text>

                        <Input
                            label="Locality *"
                            placeholder="Ex. Sector 45"
                            value={formValues.locality}
                            onChangeText={v => handleInputChange('locality', v)}
                            error={errors.locality}
                        />

                        <View className="flex-row gap-4">
                            <Input
                                label="City *"
                                placeholder="City"
                                containerClassName="flex-1"
                                value={formValues.city}
                                onChangeText={v => handleInputChange('city', v)}
                                error={errors.city}
                            />
                            <Input
                                label="State *"
                                placeholder="State"
                                containerClassName="flex-1"
                                value={formValues.state}
                                onChangeText={v => handleInputChange('state', v)}
                                error={errors.state}
                            />
                        </View>

                        <View className="flex-row gap-4">
                            <Input
                                label="Country *"
                                placeholder="Country"
                                containerClassName="flex-1"
                                value={formValues.country}
                                onChangeText={v => handleInputChange('country', v)}
                                error={errors.country}
                            />
                            <Input
                                label="Pincode *"
                                placeholder="6 digits"
                                keyboardType="numeric"
                                maxLength={6}
                                containerClassName="flex-1"
                                value={formValues.pincode}
                                onChangeText={v => handleInputChange('pincode', v)}
                                error={errors.pincode}
                            />
                        </View>
                    </View>

                    {/* Identity Verification */}
                    <View className="bg-white dark:bg-gray-900 p-4 rounded-xl mb-4 shadow-sm">
                        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Identity Verification</Text>

                        {/* Aadhaar */}
                        <Input
                            label="Aadhaar Number *"
                            placeholder="Enter Aadhaar Number"
                            keyboardType="numeric"
                            value={formValues.aadharNumber}
                            onChangeText={v => handleInputChange('aadharNumber', v)}
                            error={errors.aadharNumber}
                        />
                        <ImagePickerField
                            label={uploadLoading.aadhar ? "Uploading Aadhaar..." : "Aadhaar Card Image *"}
                            imageUri={imageUrls.aadharimg}
                            onImageSelected={(uri) => handleImagePickAndUpload('aadhar', uri)}
                            error={errors.aadharimg}
                        />

                        {/* DL */}
                        <Input
                            label="Driving License Number *"
                            placeholder="Enter DL Number"
                            value={formValues.dlNumber}
                            onChangeText={v => handleInputChange('dlNumber', v)}
                            error={errors.dlNumber}
                            containerClassName="mt-4"
                        />
                        <ImagePickerField
                            label={uploadLoading.dl ? "Uploading DL..." : "Driving License Image *"}
                            imageUri={imageUrls.dlimg}
                            onImageSelected={(uri) => handleImagePickAndUpload('dl', uri)}
                            error={errors.dlimg}
                        />

                        {/* Passport */}
                        <Input
                            label="Passport Number (Optional)"
                            placeholder="Enter Passport Number"
                            value={formValues.passportNumber}
                            onChangeText={v => handleInputChange('passportNumber', v)}
                            containerClassName="mt-4"
                        />
                        <ImagePickerField
                            label={uploadLoading.passport ? "Uploading Passport..." : "Passport Image (Optional)"}
                            imageUri={imageUrls.passportimg}
                            onImageSelected={(uri) => handleImagePickAndUpload('passport', uri)}
                        />
                    </View>

                    {/* Profile Image */}
                    <View className="bg-white dark:bg-gray-900 p-4 rounded-xl mb-6 shadow-sm">
                        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Profile Image</Text>
                        <ImagePickerField
                            label={uploadLoading.avatar ? "Uploading Avatar..." : "Your Profile Picture *"}
                            imageUri={imageUrls.avatar}
                            onImageSelected={(uri) => handleImagePickAndUpload('avatar', uri)}
                            error={errors.avatar}
                        />
                    </View>

                    <Button
                        label={isSubmitting ? "Submitting..." : "Submit Registration"}
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting || Object.values(uploadLoading).some(l => l)}
                        className="mb-6"
                    />

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
