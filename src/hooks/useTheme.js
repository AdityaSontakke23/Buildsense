import { useAppStore } from '@/src/store/appStore';
import { COLORS } from '@/src/utils/constants';

const DARK_COLORS = {
  ...COLORS,
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F1F5F9',
  textLight: '#94A3B8',
  border: '#334155',
};

export const useTheme = () => {
  const { theme, setTheme } = useAppStore();
  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return { theme, colors, isDark, toggleTheme };
};