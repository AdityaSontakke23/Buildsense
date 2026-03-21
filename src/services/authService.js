import { supabase } from './supabase';
import { logError } from '@/src/utils/errorHandler';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export const signUp = async (email, password, displayName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logError('authService.signUp', error);
    return { data: null, error };
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logError('authService.signIn', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    logError('authService.signOut', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logError('authService.getCurrentUser', error);
    return { data: null, error };
  }
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const updateProfile = async (userId, data) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    logError('authService.updateProfile', error);
    return { error };
  }
};

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'buildsense' }),
  });

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();
      if (result?.type !== 'success') {
        return { data: null, error: 'Google sign in cancelled' };
      }
      const { id_token } = result.params;
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logError('authService.signInWithGoogle', error);
      return { data: null, error };
    }
  };

  return { request, response, signInWithGoogle };
};