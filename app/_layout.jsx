import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Slot, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Provider } from 'react-redux';
import { reduxStore } from '@/src/store/redux/store';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/authStore';
import { onAuthStateChange } from '@/src/services/authService';
import { supabase } from '@/src/services/supabase';
import Loader from '@/src/components/common/Loader';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { isLoading } = useAuth();
  const hasRouted = useRef(false);

  // Single, app-wide auth state listener
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('🔥 authStateChange event:', event, '| session:', !!session);
      const { setSession, setUser, session: currentSession } = useAuthStore.getState();
      if (event === 'SIGNED_OUT' && !session && !currentSession) return;
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hide native splash immediately
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Deep link listener
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
      const params = parseTokensFromUrl(url);
      if (params?.access_token && params?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (!error) {
          if (params.type === 'recovery') router.replace('/(auth)/reset-password');
          else router.replace('/verify-email?verified=true');
        }
      }
    }

    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    Linking.getInitialURL().then(url => handleUrl(url));
    return () => subscription.remove();
  }, []);

  // Route to splash exactly once on cold start
  useEffect(() => {
    console.log('📍 _layout isLoading effect | isLoading:', isLoading, '| hasRouted:', hasRouted.current);
    if (isLoading) return;
    if (hasRouted.current) return;
    hasRouted.current = true;
    router.replace('/splash');
  }, [isLoading]);

  // ✅ REMOVED: if (isLoading) return <Loader fullScreen />;
  // That line was unmounting <Slot /> during login attempts, causing blank screen.
  // Each screen manages its own loading state via its Button's isLoading prop.

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