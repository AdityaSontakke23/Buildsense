import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/services/supabase';

function parseTokensFromUrl(url) {
  if (!url) return null;
  const hashPart = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!hashPart) return null;

  const paramMap = {};
  hashPart.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) paramMap[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return paramMap;
}

async function handleUrl(url) {
  console.log('🔗 Handling URL:', url);
  const params = parseTokensFromUrl(url);
  console.log('📦 Parsed params:', params);

  if (!params) {
    router.replace('/(auth)/login');
    return;
  }

  const { access_token, refresh_token, type } = params;

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    console.log('🔐 setSession error:', error);

    if (!error) {
      if (type === 'recovery') {
        console.log('✅ Recovery → reset-password');
        router.replace('/(auth)/reset-password');
      } else {
        console.log('✅ Verification → verified');
        router.replace('/verify-email?verified=true');
      }
      return;
    }
  }

  router.replace('/(auth)/login');
}

export default function AuthCallbackScreen() {

  useEffect(() => {
    // Case 1: App was COLD START — getInitialURL has value
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('🧊 Cold start URL:', url);
        handleUrl(url);
      }
    });

    // Case 2: App was BACKGROUNDED — event fires when deep link opens
    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('🔥 Foreground URL event:', url);
      handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#1E3A8A" />
    </View>
  );
}