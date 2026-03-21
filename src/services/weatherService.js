import axios from 'axios';
import { WEATHER_API_KEY, WEATHER_BASE_URL } from '@/src/config/appConfig';
import { parseApiError, logError } from '@/src/utils/errorHandler';

const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

const normalize = (data) => ({
  temp:       Math.round(data.main.temp),
  feelsLike:  Math.round(data.main.feels_like),
  humidity:   data.main.humidity,
  windSpeed:  data.wind?.speed ?? 0,
  cloudCover: data.clouds?.all ?? 0,
  condition:  data.weather?.[0]?.main ?? 'Clear',
  description: data.weather?.[0]?.description ?? '',
  icon:       data.weather?.[0]?.icon ?? '01d',
  uvIndex:    data.uvi ?? 0,
  fetchedAt:  Date.now(),
});

const fetchWithRetry = async (url, params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url, { params, timeout: 8000 });
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, 1000 * 2 ** i));
    }
  }
};

export const fetchWeatherByCity = async (city) => {
  try {
    // Step 1: geocode city name → lat/lon
    const geoData = await fetchWithRetry(GEO_URL, {
      q: `${city},IN`,
      limit: 1,
      appid: WEATHER_API_KEY,
    });
    if (!geoData?.length) return { data: null, error: 'City not found. Try another name.' };

    const { lat, lon, name } = geoData[0];

    // Step 2: fetch weather with coords
    const weatherData = await fetchWithRetry(`${WEATHER_BASE_URL}/weather`, {
      lat, lon,
      appid: WEATHER_API_KEY,
      units: 'metric',
    });

    return { data: { ...normalize(weatherData), city: name, lat, lon }, error: null };
  } catch (error) {
    logError('weatherService.fetchWeatherByCity', error);
    return { data: null, error: parseApiError(error) };
  }
};

export const fetchWeatherByCoords = async (lat, lon) => {
  try {
    const data = await fetchWithRetry(`${WEATHER_BASE_URL}/weather`, {
      lat, lon,
      appid: WEATHER_API_KEY,
      units: 'metric',
    });
    return { data: { ...normalize(data), lat, lon }, error: null };
  } catch (error) {
    logError('weatherService.fetchWeatherByCoords', error);
    return { data: null, error: parseApiError(error) };
  }
};