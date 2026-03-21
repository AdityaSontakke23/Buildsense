import React, { useState } from 'react';
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

export default function SignupScreen() {
  const { signUp, signInWithGoogle, googleRequest, isLoading, error } = useAuth();
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!validateProjectName(displayName)) errors.displayName = 'Name cannot be empty';
    if (!validateEmail(email)) errors.email = 'Enter a valid email address';
    if (!validatePassword(password)) errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    const { error } = await signUp(email, password, displayName);
    if (!error) router.replace('/(tabs)/home');
  };

  const handleGoogleSignup = async () => {
    const { error } = await signInWithGoogle();
    if (!error) router.replace('/(tabs)/home');
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
              Create your account
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Get started</Text>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {/* Google First — easier signup */}
            <Pressable
              onPress={handleGoogleSignup}
              disabled={!googleRequest || isLoading}
              style={({ pressed }) => [
                styles.googleBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.background : colors.surface,
                  opacity: !googleRequest ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons name="logo-google" size={18} color="#DB4437" />
              <Text style={[styles.googleText, { color: colors.text }]}>
                Sign up with Google
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textLight }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <Input
              label="Full Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Aditya Sharma"
              error={fieldErrors.displayName}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
              error={fieldErrors.password}
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              secureTextEntry
              error={fieldErrors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              isLoading={isLoading}
              style={styles.btn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textLight }]}>
              Already have an account?{' '}
            </Text>
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
    borderRadius: 16, padding: SPACING.lg,
    borderWidth: 1.5, marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  formTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.lg },
  errorBanner: { padding: SPACING.sm, borderRadius: 8, marginBottom: SPACING.md },
  errorText: { ...TYPOGRAPHY.bodySmall },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderRadius: 10, paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm, minHeight: 48, marginBottom: SPACING.xs,
  },
  googleText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SPACING.md, gap: SPACING.sm,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { ...TYPOGRAPHY.caption },
  btn: { marginTop: SPACING.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...TYPOGRAPHY.body },
  footerLink: { ...TYPOGRAPHY.body, fontWeight: '700' },
});