import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn'; // Assuming you will install clsx/tailwind-merge or use the fallback

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    loading?: boolean;
    label?: string; // Optional if you want to pass children instead
    children?: React.ReactNode;
    className?: string;
    textClassName?: string;
}

const Button = ({
    variant = 'primary',
    size = 'default',
    loading = false,
    label,
    children,
    className,
    textClassName,
    disabled,
    ...props
}: ButtonProps) => {

    const baseStyles = "flex-row items-center justify-center rounded-lg active:opacity-80";

    const variants = {
        primary: "bg-orange-500",
        secondary: "bg-gray-100 dark:bg-gray-800",
        outline: "border border-gray-300 dark:border-gray-700 bg-transparent",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
        destructive: "bg-red-500",
    };

    const sizes = {
        default: "h-12 px-5 py-3",
        sm: "h-9 px-3",
        lg: "h-14 px-8",
        icon: "h-10 w-10 p-0",
    };

    const textBaseStyles = "font-medium text-base text-center";

    const textVariants = {
        primary: "text-white",
        secondary: "text-gray-900 dark:text-gray-100",
        outline: "text-gray-900 dark:text-gray-100",
        ghost: "text-gray-900 dark:text-gray-100",
        destructive: "text-white",
    };

    return (
        <TouchableOpacity
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                disabled && "opacity-50",
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? colors.light.primary : '#fff'}
                    className="mr-2"
                />
            ) : null}

            {label ? (
                <Text className={cn(textBaseStyles, textVariants[variant], textClassName)}>
                    {label}
                </Text>
            ) : (
                children
            )}
        </TouchableOpacity>
    );
};

export { Button };
