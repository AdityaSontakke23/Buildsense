import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Animated, AppState,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/hooks/useTheme';
import Input from '@/src/components/common/Input';
import Button from '@/src/components/common/Button';
import { validateEmail } from '@/src/utils/validators';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

// ─── Step 1: Enter email & send link ────────────────────────────────────────
function SendLinkStep({ colors, onSent }) {
  const [email,      setEmail]      = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState('');

  const handleSend = async () => {
    setFieldError(''); setError('');
    if (!validateEmail(email)) {
      setFieldError('Enter a valid email address');
      return;
    }
    setIsLoading(true);
    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'com.adison.buildsense://auth-callback?type=recovery',
    });
    setIsLoading(false);
    if (sbError) { setError(sbError.message); return; }
    onSent(email);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.formTitle, { color: colors.text }]}>Reset password</Text>
      <Text style={[styles.description, { color: colors.textLight }]}>
        Enter the email linked to your account and we'll send you a reset link.
      </Text>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        error={fieldError}
      />
      <Button
        title="Send Reset Link"
        onPress={handleSend}
        isLoading={isLoading}
        style={styles.btn}
      />
    </View>
  );
}

// ─── Step 2: Waiting for user to tap email link ──────────────────────────────
function WaitingStep({ colors, email, onRecoveryReady, onTryDifferent }) {
  const pulseAnim                   = useRef(new Animated.Value(1)).current;
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading,  setResendLoading]  = useState(false);
  const [resendMsg,      setResendMsg]      = useState('');

  useEffect(() => {
    console.log('⏳ WaitingStep mounted, listening for PASSWORD_RECOVERY...');
  }, []);

  // Pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Main detection: onAuthStateChange + AppState polling ──────────────────
  useEffect(() => {
    // 1. Supabase auth event listener — most reliable
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ PASSWORD_RECOVERY event fired');
        onRecoveryReady();
      }
    });

    // 2. Fallback: poll getSession every 4s
    const checkSession = async () => {
      console.log('🔍 Polling session...');
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.recovery_sent_at) {
        console.log('✅ Recovery session detected via poll');
        onRecoveryReady();
      }
    };

    // 3. Also check immediately when app comes to foreground
    const appStateSub = AppState.addEventListener('change', nextState => {
      console.log('📱 AppState changed to:', nextState);
      if (nextState === 'active') checkSession();
    });

    const interval = setInterval(checkSession, 4000);

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
      clearInterval(interval);
    };
  }, []);

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true); setResendMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'com.adison.buildsense://auth-callback?type=recovery',
    });
    setResendLoading(false);
    if (!error) { setResendMsg('Email sent! Check your inbox.'); setResendCooldown(60); }
    else { setResendMsg('Could not send. Try again.'); }
  };

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#06B6D4']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name="mail-outline" size={48} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>

      <Text style={[styles.formTitle, { color: colors.text, textAlign: 'center' }]}>
        Check your email
      </Text>
      <Text style={[styles.description, { color: colors.textLight, textAlign: 'center' }]}>
        We sent a password reset link to
      </Text>

      <View style={[styles.emailChip, {
        backgroundColor: colors.primary + '12',
        borderColor: colors.primary + '30',
      }]}>
        <Ionicons name="mail" size={14} color={colors.primary} />
        <Text style={[styles.emailText, { color: colors.primary }]} numberOfLines={1}>
          {email}
        </Text>
      </View>

      <View style={[styles.stepsCard, {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }]}>
        {[
          { n: '1', text: 'Open your email app' },
          { n: '2', text: 'Find the email from BuildSense' },
          { n: '3', text: 'Tap the reset link' },
          { n: '4', text: "Return here — you'll be taken to reset your password" },
        ].map(step => (
          <View key={step.n} style={styles.stepRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.stepNum, { color: colors.primary }]}>{step.n}</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.text }]}>{step.text}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={handleResend}
        disabled={resendCooldown > 0 || resendLoading}
        style={({ pressed }) => [
          styles.resendBtn,
          {
            borderColor: colors.border,
            opacity: (resendCooldown > 0 || resendLoading) ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons
          name={resendLoading ? 'hourglass-outline' : 'refresh-outline'}
          size={16} color={colors.primary}
        />
        <Text style={[styles.resendText, { color: colors.primary }]}>
          {resendLoading        ? 'Sending…'
           : resendCooldown > 0 ? `Resend in ${resendCooldown}s`
           : 'Resend email'}
        </Text>
      </Pressable>

      {resendMsg ? (
        <Text style={[styles.resendMsg, {
          color: resendMsg.startsWith('Email sent') ? colors.success : colors.error,
        }]}>
          {resendMsg}
        </Text>
      ) : null}

      <Pressable onPress={onTryDifferent} style={styles.wrongAccount}>
        <Text style={[styles.wrongText, { color: colors.textLight }]}>
          Wrong email?{' '}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Try a different one</Text>
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Step 3: Set new password ────────────────────────────────────────────────
function ResetStep({ colors }) {
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);

  // Success animation + redirect
  useEffect(() => {
    if (!done) return;
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(checkScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
    const t = setTimeout(() => router.replace('/(tabs)/home'), 2200);
    return () => clearTimeout(t);
  }, [done]);

  const validate = () => {
    const errors = {};
    if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (confirm !== password) errors.confirm  = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = async () => {
    setError('');
    if (!validate()) return;
    setIsLoading(true);
    const { error: sbError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (sbError) { setError(sbError.message); return; }
    setDone(true);
  };

  if (done) {
    return (
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={[
          styles.iconWrap,
          { transform: [{ scale: checkScale }], opacity: checkOpacity },
        ]}>
          <LinearGradient
            colors={['#22C55E', '#14B8A6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="checkmark" size={52} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.formTitle, { color: colors.text, textAlign: 'center' }]}>
          Password updated!
        </Text>
        <Text style={[styles.description, { color: colors.textLight, textAlign: 'center' }]}>
          Taking you to the app…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
    </View>
  );
}

// ─── Main screen orchestrator ────────────────────────────────────────────────
export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const fadeIn     = useRef(new Animated.Value(0)).current;

  const [step,  setStep]  = useState('send');  // 'send' | 'waiting' | 'reset'
  const [email, setEmail] = useState('');

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        style={{ opacity: fadeIn }}
      >
        {/* Back button — only on send step */}
        {step === 'send' && (
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>BuildSense</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Location-aware passive thermal insights
          </Text>
        </View>

        {step === 'send' && (
          <SendLinkStep
            colors={colors}
            onSent={(sentEmail) => { setEmail(sentEmail); setStep('waiting'); }}
          />
        )}

        {step === 'waiting' && (
          <WaitingStep
            colors={colors}
            email={email}
            onRecoveryReady={() => setStep('reset')}
            onTryDifferent={() => setStep('send')}
          />
        )}

        {step === 'reset' && (
          <ResetStep colors={colors} />
        )}

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  backBtn: { marginBottom: SPACING.md },
  header:  { alignItems: 'center', marginBottom: SPACING.xl },
  title:   { ...TYPOGRAPHY.h1, fontWeight: '800', letterSpacing: 0.5 },
  subtitle:{ ...TYPOGRAPHY.bodySmall, marginTop: SPACING.xs, textAlign: 'center' },
  card: {
    borderRadius: 16, padding: SPACING.lg,
    borderWidth: 1.5, marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  formTitle:   { ...TYPOGRAPHY.h2, marginBottom: SPACING.sm },
  description: { ...TYPOGRAPHY.bodySmall, marginBottom: SPACING.lg, lineHeight: 20 },
  errorBanner: { padding: SPACING.sm, borderRadius: 8, marginBottom: SPACING.md },
  errorText:   { ...TYPOGRAPHY.bodySmall },
  btn:         { marginTop: SPACING.sm },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  iconWrap: { marginBottom: SPACING.xl },
  emailChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 20, borderWidth: 1, marginBottom: SPACING.xl, maxWidth: '90%',
  },
  emailText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', flexShrink: 1 },
  stepsCard: {
    width: '100%', borderRadius: 14, borderWidth: 1.5,
    padding: SPACING.md, gap: SPACING.md, marginBottom: SPACING.xl,
  },
  stepRow:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum:      { ...TYPOGRAPHY.caption, fontWeight: '800' },
  stepText:     { ...TYPOGRAPHY.bodySmall, flex: 1 },
  resendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2,
    borderRadius: 10, borderWidth: 1.5, marginBottom: SPACING.sm,
  },
  resendText:   { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
  resendMsg:    { ...TYPOGRAPHY.caption, marginBottom: SPACING.md, textAlign: 'center' },
  wrongAccount: { marginTop: SPACING.lg },
  wrongText:    { ...TYPOGRAPHY.bodySmall, textAlign: 'center' },
});