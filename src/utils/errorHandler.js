export const parseSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred';
  const msg = error.message ?? '';
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password';
  if (msg.includes('Email not confirmed')) return 'Please verify your email first';
  if (msg.includes('User already registered')) return 'An account with this email already exists';
  if (msg.includes('Password should be')) return 'Password must be at least 6 characters';
  if (msg.includes('JWT')) return 'Session expired, please log in again';
  return msg || 'Something went wrong with the server';
};

export const parseApiError = (error) => {
  if (!error) return 'An unknown error occurred';
  if (error.code === 'ECONNABORTED') return 'Request timed out. Try again.';
  if (!error.response) return 'Network error — check your internet connection';
  const status = error.response.status;
  if (status === 401) return 'Invalid API key';
  if (status === 404) return 'City not found';
  if (status === 429) return 'Too many requests — please wait a moment';
  if (status >= 500) return 'Weather service is unavailable right now';
  return 'Failed to fetch weather data';
};

export const logError = (context, error) => {
  console.error(`[${context}]`, error?.message ?? error);
};