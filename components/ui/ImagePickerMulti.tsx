import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

interface ImagePickerMultiProps {
    label: string;
    images?: string[];
    onImagesChange: (uris: string[]) => void;
    error?: string;
    className?: string;
    maxImages?: number;
}

export const ImagePickerMulti = ({
    label,
    images = [],
    onImagesChange,
    error,
    className,
    maxImages = 5,
}: ImagePickerMultiProps) => {
    const [loading, setLoading] = useState(false);

    const pickImages = async () => {
        if (images.length >= maxImages) {
            Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
            return;
        }

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
                allowsEditing: false, // Multi-selection usually doesn't allow editing one by one in the picker flow easily
                allowsMultipleSelection: true,
                selectionLimit: maxImages - images.length,
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newUris = result.assets.map((asset) => asset.uri);
                onImagesChange([...images, ...newUris]);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to pick images');
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (indexToRemove: number) => {
        const updatedImages = images.filter((_, index) => index !== indexToRemove);
        onImagesChange(updatedImages);
    };

    return (
        <View className={cn("mb-4", className)}>
            <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {label} ({images.length}/{maxImages})
            </Text>

            <View className="flex-row flex-wrap gap-2">
                {images.map((uri, index) => (
                    <View key={uri + index} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-700">
                        <Image
                            source={{ uri }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            onPress={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                        >
                            <Ionicons name="close" size={12} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}

                {images.length < maxImages && (
                    <TouchableOpacity
                        onPress={pickImages}
                        disabled={loading}
                        className={cn(
                            "w-24 h-24 border-2 border-dashed rounded-xl items-center justify-center bg-gray-50 dark:bg-gray-900",
                            error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                        )}
                    >
                        <Ionicons
                            name="add"
                            size={32}
                            color={colors.light.textSecondary}
                        />
                        <Text className="text-[10px] text-gray-500 mt-1">
                            {loading ? '...' : 'Add'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Text className="mt-1 text-sm text-red-500">
                    {error}
                </Text>
            )}
        </View>
    );
};
