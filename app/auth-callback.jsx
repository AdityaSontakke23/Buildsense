import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/services/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const access_token  = params.access_token;
      const refresh_token = params.refresh_token;

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) {
          // Route back to verify-email screen with verified flag
          // That screen shows the success animation then lets user in
          router.replace('/verify-email?verified=true');
          return;
        }
      }
      router.replace('/(auth)/login');
    };

    handleCallback();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#1E3A8A" />
    </View>
  );
}