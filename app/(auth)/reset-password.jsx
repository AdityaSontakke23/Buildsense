import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/src/components/common/Input';
import Button from '@/src/components/common/Button';
import { useTheme } from '@/src/hooks/useTheme';
import { supabase } from '@/src/services/supabase';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [done, setDone]               = useState(false);

  const validate = () => {
    const errors = {};
    if (password.length < 6)       errors.password = 'Password must be at least 6 characters';
    if (confirm !== password)      errors.confirm  = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = async () => {
    setError('');
    if (!validate()) return;

    setIsLoading(true);
    const { error: sbError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (sbError) {
      setError(sbError.message);
    } else {
      setDone(true);
      // Give user 2s to see success, then go home
      setTimeout(() => router.replace('/(tabs)/home'), 2000);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>BuildSense</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Location-aware passive thermal insights
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {!done ? (
              <>
                <Text style={[styles.formTitle, { color: colors.text }]}>Set new password</Text>
                <Text style={[styles.description, { color: colors.textLight }]}>
                  Choose a strong password for your account.
                </Text>

                {error ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label="New Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  secureTextEntry
                  error={fieldErrors.password}
                />
                <Input
                  label="Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Re-enter password"
                  secureTextEntry
                  error={fieldErrors.confirm}
                />

                <Button
                  title="Update Password"
                  onPress={handleReset}
                  isLoading={isLoading}
                  style={styles.btn}
                />
              </>
            ) : (
              /* ── Success state ── */
              <View style={styles.successContainer}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="checkmark-circle-outline" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.formTitle, { color: colors.text, textAlign: 'center' }]}>
                  Password updated!
                </Text>
                <Text style={[styles.description, { color: colors.textLight, textAlign: 'center' }]}>
                  Taking you to the app…
                </Text>
              </View>
            )}

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  flex:    { flex: 1 },
  scroll:  { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header:  { alignItems: 'center', marginBottom: SPACING.xl },
  title:   { ...TYPOGRAPHY.h1, fontWeight: '800', letterSpacing: 0.5 },
  subtitle:{ ...TYPOGRAPHY.bodySmall, marginTop: SPACING.xs, textAlign: 'center' },
  card: {
    borderRadius: 16, padding: SPACING.lg,
    borderWidth: 1.5, marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  formTitle:        { ...TYPOGRAPHY.h2, marginBottom: SPACING.sm },
  description:      { ...TYPOGRAPHY.bodySmall, marginBottom: SPACING.lg, lineHeight: 20 },
  errorBanner:      { padding: SPACING.sm, borderRadius: 8, marginBottom: SPACING.md },
  errorText:        { ...TYPOGRAPHY.bodySmall },
  btn:              { marginTop: SPACING.sm },
  successContainer: { alignItems: 'center', paddingVertical: SPACING.lg },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
});