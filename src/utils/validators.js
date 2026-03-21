export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

export const validateProjectName = (name) => {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 50;
};

export const validateArea = (area) => {
  const num = parseFloat(area);
  return !isNaN(num) && num > 0;
};

export const validateWWR = (wwr) => {
  const num = parseInt(wwr);
  return !isNaN(num) && num >= 10 && num <= 90;
};