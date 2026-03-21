import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Slot, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Provider } from 'react-redux';
import { reduxStore } from '@/src/store/redux/store';
import { useAuth } from '@/src/hooks/useAuth';
import Loader from '@/src/components/common/Loader';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { session, isLoading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (hasRedirected) return;      // ← only redirect once
    setHasRedirected(true);
    const timer = setTimeout(() => {
      if (session) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isLoading, session]);

  if (isLoading) return <Loader fullScreen />;

  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider store={reduxStore}>
      <RootLayoutInner />
    </Provider>
  );
}