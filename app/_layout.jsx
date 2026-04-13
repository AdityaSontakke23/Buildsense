import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Slot, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Provider } from 'react-redux';
import { reduxStore } from '@/src/store/redux/store';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/services/supabase';
import Loader from '@/src/components/common/Loader';

// Keep native splash visible until JS splash takes over
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { session, isLoading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [splashShown, setSplashShown] = useState(false);

  // Hide the native expo splash immediately — our animated splash.jsx takes over
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Show our animated splash first, then do auth routing
  useEffect(() => {
    if (splashShown) return;
    setSplashShown(true);
    // Navigate to our animated splash screen immediately on mount
    router.replace('/splash');
  }, []);

  // Deep link listener — handles auth-callback when app is open or cold launched
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url?.includes('auth-callback')) {
        supabase.auth.getSession();
      }
    });

    Linking.getInitialURL().then((url) => {
      if (url?.includes('auth-callback')) {
        supabase.auth.getSession();
      }
    });

    return () => subscription.remove();
  }, []);

  // Auth routing — only runs after splash has navigated away to login
  // The splash.jsx handles router.replace('/(auth)/login') itself.
  // This effect handles the case where the user is already logged in
  // (splash.jsx always goes to login, login screen checks session via useAuth)
  // So no extra routing needed here — but we keep it as a safety net
  // for edge cases like deep links landing on root.
  useEffect(() => {
    if (isLoading) return;
    if (hasRedirected) return;
    // Don't redirect immediately — let splash.jsx animate first (≈3s)
    // This fires only if somehow the user lands on root AFTER splash
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