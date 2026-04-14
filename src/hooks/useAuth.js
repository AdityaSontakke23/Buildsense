import { useAuthStore } from '@/src/store/authStore';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
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

  // ✅ NO onAuthStateChange listener here anymore
  // It lives in _layout.jsx and runs exactly once for the entire app

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    const { data, error } = await authSignIn(email, password);
    setLoading(false);
    if (error) {
      setError(parseSupabaseError(error));
      return { data: null, error };
    }
    setSession(data.session);
    setUser(data.user);
    return { data, error: null };
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

  const resendVerification = async (email) => {
    const { error } = await authResend(email);
    return { error };
  };

  const updateAvatar = async (localUri) => {
    if (!user?.id) return { error: new Error('No user') };
    const { url, error } = await authUploadAvatar(user.id, localUri);
    if (!error && url) {
      await updateProfile(user.id, { avatar_url: url });
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: url } });
    }
    return { url, error };
  };

  return { user, session, isLoading, error, signIn, signUp, signOut, resendVerification, updateAvatar };
};