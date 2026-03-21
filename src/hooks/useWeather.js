import { useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import * as weatherService from '@/src/services/weatherService';

export const useWeather = () => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getCachedWeather, cacheWeather } = useAppStore();

  const fetchWeather = async (city) => {
    setError(null);

    // check cache first
    const cached = getCachedWeather(city);
    if (cached) {
      setWeather(cached);
      return { data: cached, error: null };
    }

    setIsLoading(true);
    const { data, error } = await weatherService.fetchWeatherByCity(city);
    if (error) {
      setError(error);
    } else {
      setWeather(data);
      cacheWeather(city, data);
    }
    setIsLoading(false);
    return { data, error };
  };

  const fetchWeatherByCoords = async (lat, lon, cityName) => {
    setError(null);
    setIsLoading(true);
    const { data, error } = await weatherService.fetchWeatherByCoords(lat, lon);
    if (error) {
      setError(error);
    } else {
      setWeather(data);
      if (cityName) cacheWeather(cityName, data);
    }
    setIsLoading(false);
    return { data, error };
  };

  return { weather, isLoading, error, fetchWeather, fetchWeatherByCoords };
};