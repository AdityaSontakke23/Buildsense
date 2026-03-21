import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import Loader from '@/src/components/common/Loader';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, isLoading } = useAuth();
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    // add custom fonts here later if needed
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    if (session) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return <Loader fullScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-project" />
      <Stack.Screen name="details" />
    </Stack>
  );
}