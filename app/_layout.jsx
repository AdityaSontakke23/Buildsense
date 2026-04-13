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
  const [appReady, setAppReady] = useState(false);

  // Hide native splash immediately
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Deep link listener
  // Deep link listener — handles auth callbacks including password recovery
useEffect(() => {
  function parseTokensFromUrl(url) {
    if (!url) return null;
    const part = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
    if (!part) return null;
    const map = {};
    part.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) map[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return map;
  }

  async function handleUrl(url) {
    if (!url?.includes('auth-callback')) return;
    console.log('🔗 Deep link caught in _layout:', url);

    const params = parseTokensFromUrl(url);
    console.log('📦 Params:', params);

    if (params?.access_token && params?.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      console.log('🔐 setSession error:', error);

      if (!error) {
        if (params.type === 'recovery') {
          console.log('✅ Recovery → reset-password');
          router.replace('/(auth)/reset-password');
        } else {
          console.log('✅ Verify → verified');
          router.replace('/verify-email?verified=true');
        }
      }
    }
  }

  // App already open — deep link fires as event
  const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

  // App was cold started via deep link
  Linking.getInitialURL().then(url => handleUrl(url));

  return () => subscription.remove();
}, []);

  // Wait for auth to resolve, then route
  useEffect(() => {
  if (isLoading) return;
  if (appReady) return;
  setAppReady(true);
  router.replace('/splash');
}, [isLoading]);

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