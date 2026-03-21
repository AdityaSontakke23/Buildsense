import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import * as authService from '@/src/services/authService';
import { parseSupabaseError } from '@/src/utils/errorHandler';
import { useGoogleAuth } from '@/src/services/authService';

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

  const { request: googleRequest, signInWithGoogle: googleSignIn } = useGoogleAuth();

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await googleSignIn();
    if (error)
      setError(typeof error === "string" ? error : parseSupabaseError(error));
    else {
      setSession(data.session);
      setUser(data.user);
    }
    setLoading(false);
    return { data, error };
  };

  return { user, session, isLoading, error, signIn, signUp, signOut, signInWithGoogle, googleRequest };
};