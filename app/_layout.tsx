import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import "./global.css";

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // Force Dark Mode and handle hydration delay
  useEffect(() => {
    setIsMounted(true);
    if (colorScheme !== 'dark') {
      setColorScheme('dark');
    }
  }, [colorScheme]);

  useEffect(() => {
    if (!isMounted) return;

    const inAuthGroup = segments[0] === '(auth)';

    // If not signed in and acting on a protected route, go to login
    if (!accessToken && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace('/(tabs)');
    }
  }, [accessToken, segments, isMounted]);

  // Define custom Navigation Theme based on our centralized theme
  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.dark.primary,
      background: colors.dark.background,
      card: colors.dark.surface,
      text: colors.dark.text,
      border: colors.dark.border,
      notification: colors.dark.error,
    },
  };

  if (!isMounted) return null; // Or a splash screen

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}