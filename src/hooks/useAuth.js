import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  onAuthStateChange,
  resendVerification as authResend,
  uploadAvatar as authUploadAvatar,
  updateProfile,
} from '@/src/services/authService';
import { parseSupabaseError } from '@/src/utils/errorHandler';

export const useAuth = () => {
  const {
    user, session, isLoading, error,
    setUser, setSession, clearAuth, setLoading, setError,
  } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    const { data, error } = await authSignIn(email, password);
    if (error) setError(parseSupabaseError(error));
    else { setSession(data.session); setUser(data.user); }
    setLoading(false);
    return { data, error };
  };

  const signUp = async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    const { data, error } = await authSignUp(email, password, displayName);
    if (error) setError(parseSupabaseError(error));
    else { setSession(data.session); setUser(data.user); }
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    setLoading(true);
    await authSignOut();
    clearAuth();
    setLoading(false);
  };

  // NEW
  const resendVerification = async (email) => {
    // Do NOT call setLoading here — it triggers _layout.jsx redirect guard
    const { error } = await authResend(email);
    return { error };
  };

  // NEW
  const updateAvatar = async (localUri) => {
    if (!user?.id) return { error: new Error('No user') };
    setLoading(true);
    const { url, error } = await authUploadAvatar(user.id, localUri);
    if (!error && url) {
      // Persist url into profiles table
      await updateProfile(user.id, { avatar_url: url });
      // Refresh local user object so profile.jsx re-renders
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: url } });
    }
    setLoading(false);
    return { url, error };
  };

  return { user, session, isLoading, error, signIn, signUp, signOut, resendVerification, updateAvatar };
};