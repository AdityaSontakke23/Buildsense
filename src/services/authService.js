import { supabase } from './supabase';
import { logError } from '@/src/utils/errorHandler';

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