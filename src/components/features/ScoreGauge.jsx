import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { getScoreColor } from '@/src/utils/helpers';
import { useTheme } from '@/src/hooks/useTheme';
import { TYPOGRAPHY } from '@/src/utils/constants';

const ScoreGauge = ({ score, size = 160 }) => {
  const { colors } = useTheme();
  const color = getScoreColor(score);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.78;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = 240;
  const scoreAngle = startAngle + (score / 100) * totalAngle;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPath = (start, end) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Path d={arcPath(startAngle, endAngle)} stroke={colors.border}
          strokeWidth={10} fill="none" strokeLinecap="round" />
        <Path d={arcPath(startAngle, scoreAngle)} stroke={color}
          strokeWidth={10} fill="none" strokeLinecap="round" />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.score, { color }]}>{score}</Text>
        <Text style={[styles.label, { color: colors.textLight }]}>/ 100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score: { ...TYPOGRAPHY.h1, fontWeight: '800' },
  label: { ...TYPOGRAPHY.bodySmall },
});

export default React.memo(ScoreGauge);