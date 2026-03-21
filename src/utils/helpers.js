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

export const getAverageScore = (projects) => {
  if (!projects?.length) return 0;
  const total = projects.reduce((sum, p) => sum + (p.score ?? 0), 0);
  return Math.round(total / projects.length);
};

// --- Scoring Engine ---

const WALL_SCORES  = { insulated: 8, aac: 5, brick: 0, rcc: -4 };
const ROOF_SCORES  = { cool_roof: 10, rcc_insulation: 6, rcc: 0, metal: -2 };
const ORIENT_SCORES = { N: 3, NE: 2, E: 1, SE: 0, S: 0, SW: -3, W: -6, NW: -2 };
const STRATEGY_BONUSES = { shading: 6, courtyard: 4, ventilation: 6, insulation: 4 };

export const calculateThermalScore = (buildingData, weatherData) => {
  // --- component impacts (your original logic) ---
  const wallScore   = WALL_SCORES[buildingData.wallType] ?? 0;
  const roofScore   = ROOF_SCORES[buildingData.roofType] ?? 0;
  const wwrPenalty  = Math.round(((buildingData.wwr - 10) / 80) * 10);
  const orientScore = ORIENT_SCORES[buildingData.orientation] ?? 0;
  const strategyBonus = (buildingData.passiveStrategies ?? [])
    .reduce((sum, id) => sum + (STRATEGY_BONUSES[id] ?? 0), 0);

  // --- climate stress (your original normalization) ---
  let tNorm = 0, hNorm = 0, wNorm = 0, uvNorm = 0, climateStressRaw = 0;
  if (weatherData) {
    tNorm  = Math.min(Math.max((weatherData.temp - 18) / 24, 0), 1);
    hNorm  = Math.min(Math.max((weatherData.humidity - 30) / 60, 0), 1);
    wNorm  = 1 - Math.min(Math.max(weatherData.windSpeed / 8, 0), 1);
    uvNorm = Math.min(Math.max((weatherData.uvIndex ?? 0) / 11, 0), 1);
    climateStressRaw = 0.40 * tNorm + 0.25 * hNorm + 0.20 * wNorm + 0.15 * uvNorm;
  }
  const climatePenalty = Math.round(40 * climateStressRaw);

  // --- final score (your clamping) ---
  const raw = 60 + wallScore + roofScore - wwrPenalty + orientScore + strategyBonus - climatePenalty;
  const score = Math.round(Math.min(Math.max(raw, 0), 100));

  // --- derived outputs (needed by results + details screens) ---
  const comfortIndex   = Math.round((1 - climateStressRaw) * 100);
  const climateStress  = Math.round(climateStressRaw * 100);

  const overheatingRisk =
    score < 45 || (climateStressRaw > 0.7 && buildingData.wwr > 40)
      ? 'High'
      : score < 65
      ? 'Medium'
      : 'Low';

  const recommendations = [];
  const { temp = 28, humidity = 60, windSpeed = 2, uvIndex = 0 } = weatherData ?? {};

  if (uvIndex > 7 && buildingData.roofType !== 'cool_roof')
    recommendations.push({ title: 'Consider Cool Roof', reason: 'High UV detected — cool roof reduces heat gain significantly.', priority: 'High' });
  if (humidity > 70 && !(buildingData.passiveStrategies ?? []).includes('ventilation'))
    recommendations.push({ title: 'Enable Cross Ventilation', reason: 'High humidity reduces comfort; operable windows improve airflow.', priority: 'High' });
  if (windSpeed < 2 && buildingData.wwr > 35)
    recommendations.push({ title: 'Add Shading or Reduce WWR', reason: 'Low wind limits cooling; shade large windows to reduce solar gain.', priority: 'Medium' });
  if ((buildingData.orientation === 'W' || buildingData.orientation === 'SW') && !(buildingData.passiveStrategies ?? []).includes('shading'))
    recommendations.push({ title: 'Add West-facing Shading', reason: 'West orientation increases afternoon overheating risk.', priority: 'Medium' });
  if (!(buildingData.passiveStrategies ?? []).includes('insulation') && temp > 35)
    recommendations.push({ title: 'Add Thermal Insulation', reason: 'High temperatures demand insulation to maintain indoor comfort.', priority: 'Low' });
  if (recommendations.length === 0)
    recommendations.push({ title: 'Good Design Choices', reason: 'Your building configuration performs well for the current climate.', priority: 'Low' });

  return {
    score,
    comfortIndex,
    climateStress,
    climatePenalty,
    materialScore: wallScore + roofScore - wwrPenalty,
    orientationScore: orientScore,
    strategyBonus,
    overheatingRisk,
    recommendations,
  };
};