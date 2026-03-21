import axios from 'axios';
import { WEATHER_API_KEY, WEATHER_BASE_URL } from '@/src/config/appConfig';
import { parseApiError, logError } from '@/src/utils/errorHandler';

const normalize = (data) => ({
  temp: data.main.temp,
  humidity: data.main.humidity,
  condition: data.weather[0].description,
  windSpeed: data.wind.speed,
  cloudCover: data.clouds.all,
  uvIndex: data.uvi ?? 0,
  icon: data.weather[0].icon,
});

const fetchWithRetry = async (url, params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url, { params });
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, 1000 * 2 ** i));
    }
  }
};

export const fetchWeatherByCity = async (city) => {
  try {
    const data = await fetchWithRetry(`${WEATHER_BASE_URL}/weather`, {
      q: `${city},IN`,
      appid: WEATHER_API_KEY,
      units: 'metric',
    });
    return { data: normalize(data), error: null };
  } catch (error) {
    logError('weatherService.fetchWeatherByCity', error);
    return { data: null, error: parseApiError(error) };
  }
};

export const fetchWeatherByCoords = async (lat, lon) => {
  try {
    const data = await fetchWithRetry(`${WEATHER_BASE_URL}/weather`, {
      lat,
      lon,
      appid: WEATHER_API_KEY,
      units: 'metric',
    });
    return { data: normalize(data), error: null };
  } catch (error) {
    logError('weatherService.fetchWeatherByCoords', error);
    return { data: null, error: parseApiError(error) };
  }
};