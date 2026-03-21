import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import * as authService from '@/src/services/authService';
import { parseSupabaseError } from '@/src/utils/errorHandler';

export const useAuth = () => {
  const { user, session, isLoading, error, setUser, setSession, setLoading, setError, clearAuth } =
    useAuthStore();

  useEffect(() => {
    const { data: listener } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    const { data, error } = await authService.signIn(email, password);
    if (error) setError(parseSupabaseError(error));
    else {
      setSession(data.session);
      setUser(data.user);
    }
    setLoading(false);
    return { data, error };
  };

  const signUp = async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    const { data, error } = await authService.signUp(email, password, displayName);
    if (error) setError(parseSupabaseError(error));
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    clearAuth();
    setLoading(false);
  };

  return { user, session, isLoading, error, signIn, signUp, signOut };
};