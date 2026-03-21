import { COLORS, SCORE_THRESHOLDS } from './constants';

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getScoreColor = (score) => {
  if (score >= SCORE_THRESHOLDS.green) return COLORS.success;
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

export const calculateThermalScore = (buildingData, weatherData) => {
  let score = 60; // base score

  // Wall type impact (-8 to +8)
  const wallScores = { insulated: 8, aac: 5, brick: 0, rcc: -4 };
  score += wallScores[buildingData.wallType] ?? 0;

  // Roof type impact (-2 to +10)
  const roofScores = { cool_roof: 10, rcc_insulation: 6, rcc: 0, metal: -2 };
  score += roofScores[buildingData.roofType] ?? 0;

  // WWR penalty (0 to -10)
  const wwrPenalty = Math.round(((buildingData.wwr - 10) / 80) * 10);
  score -= wwrPenalty;

  // Orientation impact (-6 to +3)
  const orientationScores = {
    N: 3, NE: 2, E: 1, SE: 0, S: 0, SW: -3, W: -6, NW: -2,
  };
  score += orientationScores[buildingData.orientation] ?? 0;

  // Passive strategy bonus (0 to +20)
  const strategyBonuses = { shading: 6, courtyard: 4, ventilation: 6, insulation: 4 };
  (buildingData.passiveStrategies ?? []).forEach((id) => {
    score += strategyBonuses[id] ?? 0;
  });

  // Climate stress penalty (0 to -40)
  if (weatherData) {
    const tNorm = Math.min(Math.max((weatherData.temp - 18) / 24, 0), 1);
    const hNorm = Math.min(Math.max((weatherData.humidity - 30) / 60, 0), 1);
    const wNorm = 1 - Math.min(Math.max(weatherData.windSpeed / 8, 0), 1);
    const uvNorm = Math.min(Math.max(weatherData.uvIndex / 11, 0), 1);
    const penalty = 40 * (0.40 * tNorm + 0.25 * hNorm + 0.20 * wNorm + 0.15 * uvNorm);
    score -= penalty;
  }

  return Math.round(Math.min(Math.max(score, 0), 100));
};