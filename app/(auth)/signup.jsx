import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Pressable
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/src/components/common/Input';
import Button from '@/src/components/common/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { validateEmail, validatePassword, validateProjectName } from '@/src/utils/validators';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

// Password rules — each has a label and a test function
const PASSWORD_RULES = [
  { key: 'length',    label: 'At least 6 characters',          test: (p) => p.length >= 6 },
  { key: 'uppercase', label: 'One uppercase letter (A–Z)',      test: (p) => /[A-Z]/.test(p) },
  { key: 'number',    label: 'One number (0–9)',                test: (p) => /[0-9]/.test(p) },
  { key: 'special',   label: 'One special character (!@#...)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignupScreen() {
  const { signUp, isLoading, error } = useAuth();
  const { colors } = useTheme();

  const [displayName, setDisplayName]       = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors]       = useState({});
  const [touched, setTouched]               = useState({});

  // Evaluate each password rule live
  const passwordChecks = useMemo(() =>
    PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(password) })),
    [password]
  );
  const allRulesPassed = passwordChecks.every(r => r.passed);

  // Confirm password match state — only show after user has typed something
  const confirmTouched   = touched.confirmPassword;
  const passwordsMatch   = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmTouched && confirmPassword.length > 0 && password !== confirmPassword;

  const validate = () => {
    const errors = {};
    if (!validateProjectName(displayName)) errors.displayName = 'Name cannot be empty';
    if (!validateEmail(email))             errors.email       = 'Enter a valid email address';
    if (!allRulesPassed)                   errors.password    = 'Password does not meet all requirements';
    if (!passwordsMatch)                   errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    // Mark all fields touched on submit so errors show
    setTouched({ displayName: true, email: true, password: true, confirmPassword: true });
    if (!validate()) return;
    const { error } = await signUp(email, password, displayName);
    if (!error) {
      router.replace(
        `/verify-email?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>BuildSense</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>Create your account</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Get started</Text>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <Input
              label="Full Name"
              value={displayName}
              onChangeText={(t) => { setDisplayName(t); setFieldErrors(p => ({ ...p, displayName: undefined })); }}
              placeholder="Aditya Sharma"
              error={fieldErrors.displayName}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={(t) => { setEmail(t); setFieldErrors(p => ({ ...p, email: undefined })); }}
              placeholder="you@email.com"
              keyboardType="email-address"
              error={fieldErrors.email}
            />

            {/* Password field */}
            <Input
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setTouched(p => ({ ...p, password: true }));
                setFieldErrors(p => ({ ...p, password: undefined }));
              }}
              placeholder="Min. 6 characters"
              secureTextEntry
              error={fieldErrors.password}
              // Show green only when all rules pass and field has content
              success={password.length > 0 && allRulesPassed}
            />

            {/* Password strength checklist — shows as soon as user starts typing */}
            {touched.password && password.length > 0 && (
              <View style={[styles.rulesBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {passwordChecks.map(rule => (
                  <View key={rule.key} style={styles.ruleRow}>
                    <Ionicons
                      name={rule.passed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={rule.passed ? '#16a34a' : colors.textLight}
                    />
                    <Text style={[
                      styles.ruleText,
                      { color: rule.passed ? '#16a34a' : colors.textLight }
                    ]}>
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Confirm Password field */}
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setTouched(p => ({ ...p, confirmPassword: true }));
                setFieldErrors(p => ({ ...p, confirmPassword: undefined }));
              }}
              placeholder="Re-enter password"
              secureTextEntry
              error={passwordsMismatch ? 'Passwords do not match' : fieldErrors.confirmPassword}
              success={passwordsMatch && allRulesPassed}
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              isLoading={isLoading}
              style={styles.btn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textLight }]}>Already have an account? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Log in</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  title: { ...TYPOGRAPHY.h1, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { ...TYPOGRAPHY.bodySmall, marginTop: SPACING.xs },
  card: {
    borderRadius: 16, padding: SPACING.lg, borderWidth: 1.5,
    marginBottom: SPACING.lg, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  formTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.lg },
  errorBanner: { padding: SPACING.sm, borderRadius: 8, marginBottom: SPACING.md },
  errorText: { ...TYPOGRAPHY.bodySmall },
  btn: { marginTop: SPACING.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...TYPOGRAPHY.body },
  footerLink: { ...TYPOGRAPHY.body, fontWeight: '700' },
  rulesBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    ...TYPOGRAPHY.caption,
  },
});