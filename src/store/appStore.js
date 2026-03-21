import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/utils/constants';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      isOnline: true,
      error: null,
      weatherCache: {},

      setTheme: (theme) => set({ theme }),
      setOnline: (isOnline) => set({ isOnline }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      cacheWeather: (city, data) =>
        set((state) => ({
          weatherCache: {
            ...state.weatherCache,
            [city.toLowerCase()]: { data, fetchedAt: Date.now() },
          },
        })),

      getCachedWeather: (city) => {
        const entry = get().weatherCache[city.toLowerCase()];
        if (!entry) return null;
        const isStale = Date.now() - entry.fetchedAt > CACHE_TTL_MS;
        return isStale ? null : entry.data;
      },
    }),
    {
      name: STORAGE_KEYS.theme,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);