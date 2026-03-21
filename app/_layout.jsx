import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/src/hooks/useAuth';
import Loader from '@/src/components/common/Loader';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (session) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [session, isLoading]);

  if (isLoading) return <Loader fullScreen />;

  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}