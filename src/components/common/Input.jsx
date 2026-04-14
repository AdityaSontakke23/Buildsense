import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const Input = ({
  label, value, onChangeText, error, success,
  secureTextEntry = false, leftIcon, placeholder,
  keyboardType = 'default', style
}) => {
  const { colors } = useTheme();

  // Border color priority: error → success → default
  const borderColor = error
    ? colors.error
    : success
    ? '#16a34a'
    : colors.border;

  const bgColor = error
    ? colors.error + '08'
    : success
    ? '#16a34a08'
    : colors.surface;

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View style={[
        styles.inputRow,
        { borderColor, backgroundColor: bgColor },
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
        {/* Success checkmark */}
        {success && !error && (
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={styles.statusIcon} />
        )}
        {/* Error X icon */}
        {error && (
          <Ionicons name="close-circle" size={20} color={colors.error} style={styles.statusIcon} />
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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
  statusIcon: { marginLeft: SPACING.sm },
  errorText: { ...TYPOGRAPHY.caption, marginTop: SPACING.xs },
});

export default React.memo(Input);