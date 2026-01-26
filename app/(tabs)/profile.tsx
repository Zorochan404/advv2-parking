import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { User } from '../../api/auth.service';
import { userService } from '../../api/user.service';
import { ImagePickerField } from '../../components/ui/ImagePickerField';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { uploadToCloudinary } from '../../utils/cloudinary';

type SectionType = 'personal' | 'contact' | 'address' | 'documents' | null;

export default function ProfileScreen() {
    const { user, updateUser, logout } = useAuthStore();
    const [activeSection, setActiveSection] = useState<SectionType>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form Data
    const [formData, setFormData] = useState<Partial<User>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                number: user.number || user.phoneNumber || '',
            });
        }
    }, [user]);

    const handleInputChange = (field: keyof User, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (field: keyof User, uri: string) => {
        setUploading(prev => ({ ...prev, [field]: true }));
        try {
            const url = await uploadToCloudinary(uri);
            if (url) {
                const newData = { ...formData, [field]: url };
                setFormData(newData);

                // If it's the avatar, save immediately for better UX
                if (field === 'avatar' && user?.id) {
                    try {
                        const response = await userService.updateUserProfile(user.id, { avatar: url });
                        if (response.success && response.data) {
                            updateUser(response.data);
                        }
                    } catch (e) { console.error("Avatar auto-save failed", e); }
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Image upload failed.');
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSave = async (section: SectionType) => {
        if (!user?.id) return;
        if (Object.values(uploading).some(u => u)) {
            Alert.alert('Wait', 'Images are still uploading...');
            return;
        }

        setSubmitting(true);
        try {
            // Send ALL formData to ensure consistency.
            // Exclude system fields (createdAt, updatedAt, id) to avoid validation/type errors.
            const { createdAt, updatedAt, id, ...rest } = formData as any;

            const payload = {
                ...rest,
                number: String(formData.number || ''),
                passportNumber: formData.passportNumber || '',
                dlNumber: formData.dlNumber || '',
                aadharNumber: formData.aadharNumber || '',
                passportimg: formData.passportimg || '',
                dlimg: formData.dlimg || '',
                aadharimg: formData.aadharimg || '',
            };

            const response = await userService.updateUserProfile(user.id, payload);
            console.log("response", response);
            if (response.success && response.data) {
                updateUser(response.data);
                setActiveSection(null);
                Alert.alert('Success', 'Profile updated!');
            } else {
                Alert.alert('Error', response.message || 'Update failed');
            }
        } catch (response: any) {
            Alert.alert('Error...', response.message || 'Failed to update');
            console.log("error", response);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                ...user,
                number: user.number || user.phoneNumber || '',
            });
        }
        setActiveSection(null);
    };

    if (!user) return null;

    return (
        <View className="flex-1 bg-gray-100 dark:bg-black">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Header */}
                <View className="bg-orange-500 pt-16 pb-24 px-4 items-center rounded-b-[40px] mb-12 shadow-md">
                    <Text className="text-white text-2xl font-bold mb-1">{user.name}</Text>
                    <Text className="text-orange-100 text-sm mb-4">{user.email}</Text>
                </View>

                {/* Avatar - Absolute Positioned */}
                <View className="absolute top-32 left-1/2 -ml-16 shadow-lg z-10">
                    <View className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden relative">
                        {formData.avatar ? (
                            <Image source={{ uri: formData.avatar }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="w-full h-full items-center justify-center bg-gray-300">
                                <Ionicons name="person" size={60} color="gray" />
                            </View>
                        )}

                        {/* Invisible uploader overlay */}
                        <View className="absolute inset-0 opacity-0">
                            <ImagePickerField
                                label=""
                                imageUri={null}
                                onImageSelected={(uri) => handleImageUpload('avatar', uri)}
                                className="w-full h-full"
                            />
                        </View>
                    </View>
                    {/* Camera Icon Badge */}
                    <View className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-sm pointer-events-none">
                        <Ionicons name="camera" size={20} color={colors.light.primary} />
                    </View>
                </View>

                {/* Content */}
                <View className="px-4 -mt-2">

                    {/* Personal Information */}
                    <InfoCard
                        title="Personal Information"
                        isEditing={activeSection === 'personal'}
                        onEdit={() => setActiveSection('personal')}
                        onSave={() => handleSave('personal')}
                        onCancel={handleCancel}
                        isSubmitting={submitting}
                    >
                        <InfoRow
                            icon="person-outline"
                            label="Full Name"
                            value={formData.name}
                            isEditing={activeSection === 'personal'}
                            onChangeText={(v) => handleInputChange('name', v)}
                        />
                        <InfoRow
                            icon="calendar-outline"
                            label="Age"
                            value={formData.age?.toString()}
                            isEditing={activeSection === 'personal'}
                            onChangeText={(v) => handleInputChange('age', parseInt(v) || 0)}
                            keyboardType="numeric"
                            suffix="years"
                        />
                        <InfoRow
                            icon="card-outline"
                            label="Aadhaar Number"
                            value={formData.aadharNumber}
                            isEditing={activeSection === 'personal'}
                            onChangeText={(v) => handleInputChange('aadharNumber', v)}
                            keyboardType="numeric"
                        />
                        <InfoRow
                            icon="car-outline"
                            label="Driving License"
                            value={formData.dlNumber}
                            isEditing={activeSection === 'personal'}
                            onChangeText={(v) => handleInputChange('dlNumber', v)}
                        />
                        <InfoRow
                            icon="book-outline"
                            label="Passport Number"
                            value={formData.passportNumber}
                            isEditing={activeSection === 'personal'}
                            onChangeText={(v) => handleInputChange('passportNumber', v)}
                            placeholder="Not provided"
                        />
                    </InfoCard>

                    {/* Contact Information */}
                    <InfoCard
                        title="Contact Information"
                        isEditing={activeSection === 'contact'}
                        onEdit={() => setActiveSection('contact')}
                        onSave={() => handleSave('contact')}
                        onCancel={handleCancel}
                        isSubmitting={submitting}
                    >
                        <InfoRow
                            icon="mail-outline"
                            label="Email Address"
                            value={formData.email}
                            isEditing={activeSection === 'contact'}
                            onChangeText={(v) => handleInputChange('email', v)}
                            keyboardType="email-address"
                        />
                        <InfoRow
                            icon="call-outline"
                            label="Phone Number"
                            value={formData.number}
                            isEditing={activeSection === 'contact'}
                            onChangeText={(v) => handleInputChange('number', v)}
                            keyboardType="phone-pad"
                        />
                    </InfoCard>

                    {/* Address */}
                    <InfoCard
                        title="Address"
                        isEditing={activeSection === 'address'}
                        onEdit={() => setActiveSection('address')}
                        onSave={() => handleSave('address')}
                        onCancel={handleCancel}
                        isSubmitting={submitting}
                    >
                        <InfoRow
                            icon="location-outline"
                            label="Locality / Street"
                            value={formData.locality}
                            isEditing={activeSection === 'address'}
                            onChangeText={(v) => handleInputChange('locality', v)}
                        />
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <InfoRow
                                    icon="business-outline"
                                    label="City"
                                    value={formData.city}
                                    isEditing={activeSection === 'address'}
                                    onChangeText={(v) => handleInputChange('city', v)}
                                />
                            </View>
                            <View className="flex-1">
                                <InfoRow
                                    icon="map-outline"
                                    label="State"
                                    value={formData.state}
                                    isEditing={activeSection === 'address'}
                                    onChangeText={(v) => handleInputChange('state', v)}
                                />
                            </View>
                        </View>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <InfoRow
                                    icon="globe-outline"
                                    label="Country"
                                    value={formData.country}
                                    isEditing={activeSection === 'address'}
                                    onChangeText={(v) => handleInputChange('country', v)}
                                />
                            </View>
                            <View className="flex-1">
                                <InfoRow
                                    icon="pin-outline"
                                    label="PIN Code"
                                    value={formData.pincode?.toString()}
                                    isEditing={activeSection === 'address'}
                                    onChangeText={(v) => handleInputChange('pincode', parseInt(v) || '')}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </InfoCard>

                    {/* Documents */}
                    <InfoCard
                        title="Documents"
                        isEditing={activeSection === 'documents'}
                        onEdit={() => setActiveSection('documents')}
                        onSave={() => handleSave('documents')}
                        onCancel={handleCancel}
                        isSubmitting={submitting}
                    >
                        <DocumentRow
                            label="Aadhaar Card"
                            imageUri={formData.aadharimg}
                            isEditing={activeSection === 'documents'}
                            onImageSelected={(uri) => handleImageUpload('aadharimg', uri)}
                            uploading={uploading.aadharimg}
                        />
                        <DocumentRow
                            label="Driving License"
                            imageUri={formData.dlimg}
                            isEditing={activeSection === 'documents'}
                            onImageSelected={(uri) => handleImageUpload('dlimg', uri)}
                            uploading={uploading.dlimg}
                        />
                        <DocumentRow
                            label="Passport"
                            imageUri={formData.passportimg}
                            isEditing={activeSection === 'documents'}
                            onImageSelected={(uri) => handleImageUpload('passportimg', uri)}
                            uploading={uploading.passportimg}
                        />
                    </InfoCard>

                    <TouchableOpacity onPress={() => logout()} className="bg-orange-500 p-4 rounded-xl items-center justify-center mt-4 border border-red-100">
                        <Text className="text-white font-bold">Logout</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </View>
    );
}

// --- Components ---

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

function InfoCard({ title, children, isEditing, onEdit, onSave, onCancel, isSubmitting }: InfoCardProps) {
    return (
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-lg font-bold text-white dark:text-white">{title}</Text>
                {isEditing ? (
                    <View className="flex-row gap-4 items-center">
                        <TouchableOpacity onPress={onSave} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={colors.light.success} />
                            ) : (
                                <Ionicons name="checkmark-sharp" size={24} color={colors.light.success} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onCancel} disabled={isSubmitting}>
                            <Ionicons name="close-sharp" size={24} color={colors.light.error} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={onEdit}>
                        <Ionicons name="create-outline" size={22} color={colors.light.primary} />
                    </TouchableOpacity>
                )}
            </View>
            <View className="gap-6">
                {children}
            </View>
        </View>
    );
}

interface InfoRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string | number;
    isEditing: boolean;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    placeholder?: string;
    suffix?: string;
}

function InfoRow({ icon, label, value, isEditing, onChangeText, keyboardType = 'default', placeholder = 'Not provided', suffix }: InfoRowProps) {
    const displayValue = value ? String(value) : '';

    return (
        <View className="flex-row gap-4 items-start">
            <View className="mt-1">
                <Ionicons name={icon} size={22} color="#9ca3af" />
            </View>
            <View className="flex-1 border-b border-gray-100 pb-2">
                <Text className="text-xs text-white font-medium mb-1">{label}</Text>
                {isEditing ? (
                    <TextInput
                        className="text-base text-white font-medium p-0"
                        value={displayValue}
                        onChangeText={onChangeText}
                        keyboardType={keyboardType}
                        placeholder={placeholder}
                    />
                ) : (
                    <Text className={`text-base font-medium ${!displayValue ? 'text-orange-500 italic' : 'text-white'}`}>
                        {displayValue || placeholder} {displayValue && suffix ? suffix : ''}
                    </Text>
                )}
            </View>
        </View>
    );
}

// --- New Document Row Component ---

interface DocumentRowProps {
    label: string;
    imageUri?: string;
    isEditing: boolean;
    onImageSelected: (uri: string) => void;
    uploading?: boolean;
}

function DocumentRow({ label, imageUri, isEditing, onImageSelected, uploading }: DocumentRowProps) {
    return (
        <View className="mb-2">
            <Text className="text-xs text-gray-400 font-medium mb-2">{label}</Text>
            {isEditing ? (
                <ImagePickerField
                    label={uploading ? "Uploading..." : (imageUri ? "Change Image" : "Upload Image")}
                    imageUri={imageUri}
                    onImageSelected={onImageSelected}
                    className="w-full h-40"
                />
            ) : (
                <View className="h-40 w-full bg-gray-50 rounded-xl overflow-hidden items-center justify-center border border-gray-100">
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="items-center">
                            <Ionicons name="image-outline" size={32} color="#e5e7eb" />
                            <Text className="text-gray-300 text-xs mt-1">No Image</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
