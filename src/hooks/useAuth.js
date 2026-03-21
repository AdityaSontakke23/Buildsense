import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  onAuthStateChange,
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

  return { user, session, isLoading, error, signIn, signUp, signOut };
};