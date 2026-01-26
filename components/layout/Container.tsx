import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

interface ContainerProps extends ViewProps {
    children: React.ReactNode;
    centered?: boolean;
}

export const Container = ({ children, className, centered, ...props }: ContainerProps) => {
    return (
        <View
            className={cn(
                "flex-1 px-4 bg-gray-50 dark:bg-gray-950",
                centered && "items-center justify-center",
                className
            )}
            {...props}
        >
            {children}
        </View>
    );
};
