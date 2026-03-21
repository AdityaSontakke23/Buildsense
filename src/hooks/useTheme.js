import { useAppStore } from '@/src/store/appStore';
import { COLORS } from '@/src/utils/constants';

const DARK_COLORS = {
  // Base surfaces — deep navy, not pure black
  background:  '#0A1628',
  surface:     '#152035',
  border:      '#1E3A5F',

  // Text — bright and readable on dark navy
  text:        '#F1F5F9',
  textLight:   '#94A3B8',

  // Primary — was dark blue #1E3A8A (invisible on dark bg), now bright sky blue
  primary:     '#60A5FA',

  // Secondary — brighter electric cyan
  secondary:   '#38BDF8',

  // Semantic — all bumped brighter so they pop on dark navy
  success:     '#34D399',
  warning:     '#FBBF24',
  error:       '#F87171',

  // Keep any other COLORS keys that aren't overridden
  ...COLORS,

  // Re-apply overrides after spread so COLORS doesn't clobber them
  background:  '#131a22',
  surface:     '#152035',
  border:      '#1E3A5F',
  text:        '#F1F5F9',
  textLight:   '#94A3B8',
  primary:     '#60A5FA',
  secondary:   '#38BDF8',
  success:     '#34D399',
  warning:     '#FBBF24',
  error:       '#F87171',
};

// Gradient tokens — used in home.jsx and any screen with gradients
// Import these wherever you use LinearGradient so dark mode gets correct stops
export const GRADIENTS = {
  firstName: ['#9760d2', '#7ee887', '#d0f183', '#F5D9B0'],  // your custom name gradient
  heroBanner: ['#6366F1', '#8B5CF6', '#06B6D4'],             // Ocean Breeze — Option A
  headerBg: {
    light: ['#1E3A8A12', '#1E3A8A00'],
    dark:  ['#60A5FA18', '#60A5FA00'],                        // brighter tint on dark bg
  },
};

export const useTheme = () => {
  const { theme, setTheme } = useAppStore();
  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return { theme, colors, isDark, toggleTheme };
};