import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons is available in @expo/vector-icons
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { colors } from '../../theme/colors';

export default function TabLayout() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.dark.primary, // Always orange as requested
                tabBarInactiveTintColor: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
                tabBarStyle: {
                    backgroundColor: isDark ? colors.dark.background : colors.light.background,
                    borderTopColor: isDark ? colors.dark.border : colors.light.border,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="requests"
                options={{
                    title: 'Verification',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="ticket" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cars"
                options={{
                    title: 'Cars',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
