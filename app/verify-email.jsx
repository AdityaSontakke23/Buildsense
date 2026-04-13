import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Animated, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';
import { checkEmailConfirmed } from '@/src/services/authService';

export default function VerifyEmailScreen() {
  const { colors }             = useTheme();
  const { resendVerification } = useAuth();
  const params                 = useLocalSearchParams();

  const [emailDisplay, setEmailDisplay] = useState(
    params.email ? decodeURIComponent(params.email) : ''
  );
  const password   = params.password ? decodeURIComponent(params.password) : '';
  const isVerified = params.verified === 'true';

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg,      setResendMsg]      = useState('');
  const [resendLoading,  setResendLoading]  = useState(false);

  // ── Resolve email from session if not in params ──────────
  useEffect(() => {
    if (emailDisplay) return;
    const resolve = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        setEmailDisplay(data.session.user.email);
      }
    };
    resolve();
  }, []);

  // ── Animations ───────────────────────────────────────────
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const fadeIn       = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    if (isVerified) {
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(checkScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
          Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
      const t = setTimeout(() => router.replace('/(tabs)/home'), 2200);
      return () => clearTimeout(t);
    } else {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isVerified]);

  // ── Poll for verification ─────────────────────────────────
  useEffect(() => {
    if (isVerified) return;

    const checkVerification = async () => {
      if (!emailDisplay || !password) {
        console.log('❌ Missing email or password for verification check');
        return;
      }
      console.log('🔍 Checking verification...');
      const { confirmed, error } = await checkEmailConfirmed(emailDisplay, password);
      console.log('Confirmed:', confirmed, '| Error:', error?.message);
      if (confirmed) {
        console.log('✅ Verified! Navigating...');
        router.replace('/verify-email?verified=true');
      }
    };

    // Check when app comes to foreground
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkVerification();
    });

    // Poll every 4 seconds
    const interval = setInterval(checkVerification, 4000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [isVerified, emailDisplay, password]);

  // ── Resend cooldown ───────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !emailDisplay || resendLoading) return;
    setResendLoading(true);
    setResendMsg('');
    const { error } = await resendVerification(emailDisplay);
    setResendLoading(false);
    if (!error) {
      setResendMsg('Email sent! Check your inbox.');
      setResendCooldown(60);
    } else {
      setResendMsg('Could not send. Check the email address and try again.');
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>

        {isVerified ? (
          <>
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

            <Text style={[styles.title, { color: colors.text }]}>Email Verified!</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              You're all set. Taking you in…
            </Text>
            <View style={[styles.pillRow, {
              backgroundColor: colors.success + '15',
              borderColor:     colors.success + '30',
            }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
              <Text style={[styles.pillText, { color: colors.success }]}>Account verified</Text>
            </View>
          </>
        ) : (
          <>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#06B6D4']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="mail-outline" size={48} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              We sent a confirmation link to
            </Text>

            <View style={[styles.emailChip, {
              backgroundColor: colors.primary + '12',
              borderColor:     colors.primary + '30',
            }]}>
              <Ionicons name="mail" size={14} color={colors.primary} />
              <Text style={[styles.emailText, { color: colors.primary }]} numberOfLines={1}>
                {emailDisplay || '…'}
              </Text>
            </View>

            <View style={[styles.stepsCard, {
              backgroundColor: colors.surface,
              borderColor:     colors.border,
            }]}>
              {[
                { n: '1', text: 'Open your email app' },
                { n: '2', text: 'Find the email from BuildSense' },
                { n: '3', text: 'Tap the confirmation link' },
                { n: '4', text: "Return here — you'll be let in automatically" },
              ].map((step) => (
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
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.resendText, { color: colors.primary }]}>
                {resendLoading        ? 'Sending…'
                 : resendCooldown > 0 ? `Resend in ${resendCooldown}s`
                 : 'Resend email'}
              </Text>
            </Pressable>

            {resendMsg !== '' && (
              <Text style={[styles.resendMsg, {
                color: resendMsg.startsWith('Email sent') ? colors.success : colors.error,
              }]}>
                {resendMsg}
              </Text>
            )}

            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={styles.wrongAccount}
            >
              <Text style={[styles.wrongText, { color: colors.textLight }]}>
                Wrong account?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Log in instead
                </Text>
              </Text>
            </Pressable>
          </>
        )}

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: SPACING.lg,
  },

  iconWrap:   { marginBottom: SPACING.xl },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },

  title:    { ...TYPOGRAPHY.h2, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.body, textAlign: 'center', marginBottom: SPACING.md },

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
  stepNum:  { ...TYPOGRAPHY.caption, fontWeight: '800' },
  stepText: { ...TYPOGRAPHY.bodySmall, flex: 1 },

  resendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2,
    borderRadius: 10, borderWidth: 1.5, marginBottom: SPACING.sm,
  },
  resendText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
  resendMsg:  { ...TYPOGRAPHY.caption, marginBottom: SPACING.md, textAlign: 'center' },

  wrongAccount: { marginTop: SPACING.lg },
  wrongText:    { ...TYPOGRAPHY.bodySmall, textAlign: 'center' },

  pillRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 20, borderWidth: 1, marginTop: SPACING.xl,
  },
  pillText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
});