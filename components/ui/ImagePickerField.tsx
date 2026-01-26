import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

interface ImagePickerFieldProps {
    label: string;
    imageUri?: string | null;
    onImageSelected: (uri: string) => void;
    error?: string;
    className?: string;
}

export const ImagePickerField = ({
    label,
    imageUri,
    onImageSelected,
    error,
    className,
}: ImagePickerFieldProps) => {
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        try {
            setLoading(true);
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7, // Compress slightly for faster uploads
            });

            if (!result.canceled && result.assets[0].uri) {
                onImageSelected(result.assets[0].uri);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to pick image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className={cn("mb-4", className)}>
            <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </Text>

            <TouchableOpacity
                onPress={pickImage}
                className={cn(
                    "w-full h-40 border-2 border-dashed rounded-xl items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900",
                    error ? "border-red-500" : "border-gray-300 dark:border-gray-700",
                    imageUri ? "border-solid" : ""
                )}
            >
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="items-center">
                        <Ionicons
                            name="cloud-upload-outline"
                            size={32}
                            color={colors.light.textSecondary}
                        />
                        <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {loading ? 'Opening Gallery...' : 'Tap to upload'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {error && (
                <Text className="mt-1 text-sm text-red-500">
                    {error}
                </Text>
            )}
        </View>
    );
};
