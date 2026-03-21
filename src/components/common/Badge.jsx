import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getScoreColor } from '@/src/utils/helpers';
import { TYPOGRAPHY, SPACING } from '@/src/utils/constants';

const Badge = ({ score }) => {
  const color = getScoreColor(score);
  const label = score >= 70 ? 'Good' : score >= 40 ? 'Medium' : 'Poor';

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.score, { color }]}>{score}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    minWidth: 56,
  },
  score: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  label: { ...TYPOGRAPHY.caption, fontWeight: '600' },
});

export default React.memo(Badge);