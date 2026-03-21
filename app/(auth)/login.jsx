import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Pressable
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/src/components/common/Input';
import Button from '@/src/components/common/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { validateEmail, validatePassword } from '@/src/utils/validators';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

export default function LoginScreen() {
  const { signIn, isLoading, error } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!validateEmail(email)) errors.email = 'Enter a valid email address';
    if (!validatePassword(password)) errors.password = 'Password must be at least 6 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const { error } = await signIn(email, password);
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
              Location-aware passive thermal insights
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Welcome back</Text>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

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

            <Button
              title="Log In"
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.btn}
            />

            <Pressable style={styles.linkRow}>
              <Text style={[styles.link, { color: colors.textLight }]}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textLight }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign up</Text>
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
  subtitle: { ...TYPOGRAPHY.bodySmall, marginTop: SPACING.xs, textAlign: 'center' },
  card: {
    borderRadius: 16, padding: SPACING.lg,
    borderWidth: 1.5, marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  formTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.lg },
  errorBanner: {
    padding: SPACING.sm, borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: { ...TYPOGRAPHY.bodySmall },
  btn: { marginTop: SPACING.sm },
  linkRow: { alignItems: 'center', marginTop: SPACING.md },
  link: { ...TYPOGRAPHY.bodySmall },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...TYPOGRAPHY.body },
  footerLink: { ...TYPOGRAPHY.body, fontWeight: '700' },
});