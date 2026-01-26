import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { authService, LoginRequest } from '../../api/auth.service';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        // Basic Validation
        if (!identifier || !password) {
            setError('Please enter both identifier and password');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const payload: LoginRequest = {
                identifier,
                password,
                authMethod: 'password',
            };

            const response = await authService.login(payload);

            if (response.success && response.data) {
                const { user, tokens } = response.data;
                // Update global store and persist tokens
                login(user, tokens.accessToken, tokens.refreshToken);

                // Navigate to main app
                router.replace('/(tabs)');
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'An unexpected error occurred';
            setError(message);
            Alert.alert('Login Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container centered className="p-6">
            <View className="w-full max-w-sm">
                <Text className="text-3xl font-bold text-orange-500 mb-2 text-center">
                    Welcome Back
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 mb-8 text-center">
                    Sign in to access your account
                </Text>

                <Input
                    label="Identifier"
                    placeholder="Phone or Email"
                    value={identifier}
                    onChangeText={(text) => {
                        setIdentifier(text);
                        setError(null);
                    }}
                    autoCapitalize="none"
                    error={error ? ' ' : undefined} // Visually indicate error state if needed
                />

                <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setError(null);
                    }}
                    secureTextEntry
                    error={error || undefined}
                />

                <Button
                    label="Sign In"
                    onPress={handleLogin}
                    loading={isLoading}
                    className="w-full mt-4"
                />

                <Button
                    label="Forgot Password?"
                    variant="ghost"
                    onPress={() => console.log('Forgot Password Pressed')}
                    className="mt-2"
                />

                <Button
                    label="Don't have an account? Sign Up"
                    variant="ghost"
                    onPress={() => router.push('/(auth)/register')}
                    className="mt-2"
                />
            </View>
        </Container>
    );
}
