import Constants from 'expo-constants';

const {
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_WEATHER_API_KEY,
} = Constants.expoConfig.extra ?? process.env;

export const SUPABASE_URL = EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const WEATHER_API_KEY = EXPO_PUBLIC_WEATHER_API_KEY;
export const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';