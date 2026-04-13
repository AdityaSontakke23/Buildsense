import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/src/hooks/useTheme';
import { TYPOGRAPHY } from '@/src/utils/constants';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Vivid score colors that pop on ANY background (dark card or light screen)
const getVividScoreColor = (score) => {
  if (score >= 75) return '#22C55E'; // bright green
  if (score >= 50) return '#F59E0B'; // vivid amber
  if (score >= 30) return '#F97316'; // vivid orange
  return '#EF4444';                  // vivid red
};

// Subtle track color: white/black alpha depending on theme
const getTrackColor = (isDark) =>
  isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)';

const ScoreGauge = ({ score, size = 160, onCard = false }) => {
  const { colors, isDark } = useTheme();

  const safeScore = (typeof score === 'number' && !isNaN(score))
    ? Math.min(100, Math.max(0, score))
    : 0;

  // On a colored card always use vivid; off-card also use vivid (looks better everywhere)
  const arcColor   = getVividScoreColor(safeScore);
  const trackColor = getTrackColor(isDark);

  const cx = size / 2;
  const cy = size / 2;
  const r  = (size / 2) * 0.78;

  const startAngle = -210;
  const endAngle   = 30;
  const totalAngle = 240;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (start, end) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const arcLength  = (totalAngle / 360) * 2 * Math.PI * r;
  const fillLength = (safeScore / 100) * arcLength;

  const animatedDash  = useRef(new Animated.Value(0)).current;
  const animatedScore = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedDash, {
      toValue: fillLength,
      duration: 1000,
      delay: 150,
      useNativeDriver: false,
    }).start();

    Animated.timing(animatedScore, {
      toValue: safeScore,
      duration: 1000,
      delay: 150,
      useNativeDriver: false,
    }).start();
  }, [safeScore]);

  const [displayVal, setDisplayVal] = React.useState(0);
  useEffect(() => {
    const id = animatedScore.addListener(({ value }) =>
      setDisplayVal(Math.round(value))
    );
    return () => animatedScore.removeListener(id);
  }, []);

  const trackPath = arcPath(startAngle, endAngle);

  // Text colors: always white on card, theme-aware off card
  const scoreTextColor = onCard ? '#FFFFFF' : arcColor;
  const labelTextColor = onCard ? 'rgba(255,255,255,0.6)' : colors.textLight;

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        {/* Track — alpha-based so it works on any bg */}
        <Path
          d={trackPath}
          stroke={trackColor}
          strokeWidth={11}
          fill="none"
          strokeLinecap="round"
        />

        {/* Animated fill arc */}
        {safeScore > 0 && (
          <AnimatedPath
            d={trackPath}
            stroke={arcColor}
            strokeWidth={11}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={animatedDash.interpolate({
              inputRange:  [0, arcLength],
              outputRange: [arcLength, arcLength - fillLength],
            })}
          />
        )}
      </Svg>

      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.score, { color: scoreTextColor }]}>
          {displayVal}
        </Text>
        <Text style={[styles.label, { color: labelTextColor }]}>/ 100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  center:  { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score:   { ...TYPOGRAPHY.h1, fontWeight: '800' },
  label:   { ...TYPOGRAPHY.bodySmall },
});

export default React.memo(ScoreGauge);