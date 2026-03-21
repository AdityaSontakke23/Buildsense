export const COLORS = {
  primary: '#1E3A8A',
  secondary: '#14B8A6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '400' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const STORAGE_KEYS = {
  authToken: 'buildsense_auth_token',
  userData: 'buildsense_user_data',
  theme: 'buildsense_theme',
};

export const SCORE_THRESHOLDS = {
  green: 70,
  yellow: 40,
};

export const ORIENTATION_OPTIONS = [
  { label: 'N', value: 'N' },
  { label: 'NE', value: 'NE' },
  { label: 'E', value: 'E' },
  { label: 'SE', value: 'SE' },
  { label: 'S', value: 'S' },
  { label: 'SW', value: 'SW' },
  { label: 'W', value: 'W' },
  { label: 'NW', value: 'NW' },
];

export const WALL_TYPES = [
  { label: 'Brick', value: 'brick' },
  { label: 'RCC', value: 'rcc' },
  { label: 'AAC Block', value: 'aac' },
  { label: 'Insulated', value: 'insulated' },
];

export const ROOF_TYPES = [
  { label: 'RCC Slab', value: 'rcc' },
  { label: 'RCC + Insulation', value: 'rcc_insulation' },
  { label: 'Metal Sheet', value: 'metal' },
  { label: 'Cool Roof', value: 'cool_roof' },
];

export const WWR_RANGE = { min: 10, max: 90 };

export const PASSIVE_STRATEGIES = [
  {
    id: 'shading',
    label: 'Shading',
    description: 'Overhangs, fins or external blinds to reduce direct solar gain',
  },
  {
    id: 'courtyard',
    label: 'Courtyard',
    description: 'Central open space that promotes natural airflow and cooling',
  },
  {
    id: 'ventilation',
    label: 'Cross Ventilation',
    description: 'Operable windows positioned for wind-driven airflow',
  },
  {
    id: 'insulation',
    label: 'Insulation',
    description: 'Thermal insulation in walls or roof to reduce heat transfer',
  },
];