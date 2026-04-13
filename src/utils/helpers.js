import { COLORS, SCORE_THRESHOLDS } from './constants';
export { calculateThermalScore } from './thermalEngine';

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const getScoreColor = (score) => {
  if (score >= SCORE_THRESHOLDS.green)  return COLORS.success;
  if (score >= SCORE_THRESHOLDS.yellow) return COLORS.warning;
  return COLORS.error;
};

export const getOrientationLabel = (value) => {
  const map = {
    N: 'North', NE: 'North East', E: 'East', SE: 'South East',
    S: 'South', SW: 'South West', W: 'West', NW: 'North West',
  };
  return map[value] ?? value;
};

export const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const getAverageScore = (projects) => {
  if (!projects?.length) return 0;
  const total = projects.reduce((sum, p) => sum + (p.score ?? 0), 0);
  return Math.round(total / projects.length);
};