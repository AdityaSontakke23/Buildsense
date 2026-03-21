import React, { useCallback } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const StrategyToggle = ({ strategy, enabled, onToggle }) => {
  const { colors } = useTheme();

  const handleToggle = useCallback(() => {
    onToggle?.(strategy.id);
  }, [strategy.id, onToggle]);

  return (
    <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.text }]}>{strategy.label}</Text>
        <Text style={[styles.desc, { color: colors.textLight }]}>{strategy.description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: colors.border, true: colors.secondary + '80' }}
        thumbColor={enabled ? colors.secondary : colors.textLight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
  },
  info: { flex: 1, marginRight: SPACING.md },
  label: { ...TYPOGRAPHY.body, fontWeight: '600', marginBottom: 2 },
  desc: { ...TYPOGRAPHY.caption },
});

export default React.memo(StrategyToggle);