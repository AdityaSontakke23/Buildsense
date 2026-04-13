import { supabase } from './supabase';
import { logError } from '@/src/utils/errorHandler';

const APP_REDIRECT = 'com.adison.buildsense://auth-callback';

export const signUp = async (email, password, displayName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: APP_REDIRECT,
      },
    });

    // "Error sending confirmation email" means user was created
    // but the email delivery failed. We treat this as a soft success
    // so the user still lands on verify-email screen.
    if (error) {
      const isEmailDeliveryError =
        error.message?.toLowerCase().includes('sending confirmation email') ||
        error.message?.toLowerCase().includes('error sending');

      if (isEmailDeliveryError) {
        // User exists, just email didn't send — still navigate to verify screen
        // They can use the Resend button there
        logError('authService.signUp (email delivery only)', error);
        return { data, error: null }; // treat as success
      }

      throw error; // real errors (duplicate email, weak password etc) still throw
    }

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

export const resendVerification = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: APP_REDIRECT,
      },
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    logError('authService.resendVerification', error);
    return { error };
  }
};

export const uploadAvatar = async (userId, localUri) => {
  try {
    const response = await fetch(localUri);
    const blob     = await response.blob();
    const ext      = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { upsert: true, contentType: `image/${ext}` });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    return { url: publicUrl, error: null };
  } catch (error) {
    logError('authService.uploadAvatar', error);
    return { url: null, error };
  }
};

export const checkEmailConfirmed = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { confirmed: false, error };
    return { confirmed: !!data.session, error: null };
  } catch (error) {
    return { confirmed: false, error };
  }
};