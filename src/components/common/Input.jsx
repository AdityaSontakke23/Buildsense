import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const Input = ({ label, value, onChangeText, error, secureTextEntry = false,
  leftIcon, placeholder, keyboardType = 'default', style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View style={[
        styles.inputRow,
        { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface },
      ]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[styles.input, { color: colors.text }]}
          autoCapitalize="none"
        />
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  label: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginBottom: SPACING.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  icon: { marginRight: SPACING.sm },
  input: { flex: 1, ...TYPOGRAPHY.body, paddingVertical: SPACING.sm },
  error: { ...TYPOGRAPHY.caption, marginTop: SPACING.xs },
});

export default React.memo(Input);