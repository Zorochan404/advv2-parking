import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const Input = ({
    label,
    error,
    className,
    containerClassName,
    ...props
}: InputProps) => {
    return (
        <View className={cn("w-full mb-4", containerClassName)}>
            {label && (
                <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </Text>
            )}
            <TextInput
                className={cn(
                    "w-full h-12 px-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500",
                    error && "border-red-500 focus:border-red-500",
                    className
                )}
                placeholderTextColor={colors.light.textSecondary}
                selectionColor={colors.light.primary}
                {...props}
            />
            {error && (
                <Text className="mt-1 text-sm text-red-500">
                    {error}
                </Text>
            )}
        </View>
    );
};
