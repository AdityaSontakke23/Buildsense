import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const STEP_LABELS = ['Location', 'Building', 'Envelope', 'Strategies', 'Review'];

const StepProgressBar = ({ currentStep, totalSteps = 5 }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.barRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={styles.segmentWrapper}>
            <View style={[
              styles.segment,
              { backgroundColor: i < currentStep ? colors.primary : colors.border },
            ]} />
          </View>
        ))}
      </View>
      <Text style={[styles.label, { color: colors.textLight }]}>
        Step {currentStep} of {totalSteps} — {STEP_LABELS[currentStep - 1]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  barRow: { flexDirection: 'row', gap: 4, marginBottom: SPACING.xs },
  segmentWrapper: { flex: 1 },
  segment: { height: 4, borderRadius: 2 },
  label: { ...TYPOGRAPHY.caption, textAlign: 'center' },
});

export default React.memo(StepProgressBar);