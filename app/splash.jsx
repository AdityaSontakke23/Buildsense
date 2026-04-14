import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { session, isLoading } = useAuth();

  // ✅ Always reflects the latest session without re-triggering the effect
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const logoScale      = useRef(new Animated.Value(0.5)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const glowScale      = useRef(new Animated.Value(0.6)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const textY          = useRef(new Animated.Value(12)).current;
  const tagOpacity     = useRef(new Animated.Value(0)).current;
  const lineWidth      = useRef(new Animated.Value(0)).current;
  const versionOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity    = useRef(new Animated.Value(1)).current;

  const animationStarted = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (animationStarted.current) return;
    animationStarted.current = true;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(lineWidth, { toValue: 140, duration: 450, useNativeDriver: false }),
        Animated.timing(tagOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(versionOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.delay(1400),
      Animated.timing(exitOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start(() => {
      // ✅ Read from ref — always gets current session, not stale closure value
      const currentSession = sessionRef.current;

      if (!currentSession) {
        router.replace('/(auth)/login');
        return;
      }
      const emailConfirmed = currentSession?.user?.email_confirmed_at;
      if (!emailConfirmed) {
        router.replace('/verify-email');
        return;
      }
      router.replace('/(tabs)/home');
    });
  }, [isLoading]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0C0820" />
      <Animated.View style={[styles.root, { opacity: exitOpacity }]}>

        <LinearGradient
          colors={['#160F2E', '#0C0820', '#080614']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[styles.glowBlob, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        />

        <View style={styles.glowBlobSecondary} />

        <Animated.View
          style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        >
          <View style={styles.markContainer}>
            <View style={styles.glowRing} />
            <View style={styles.iconCircle}>
              <View style={styles.buildingWrap}>
                <View style={[styles.tower, styles.towerLeft]} />
                <View style={styles.buildingBody}>
                  {[0,1,2,3,4,5].map(i => (
                    <View key={i} style={styles.windowDot} />
                  ))}
                </View>
                <View style={[styles.tower, styles.towerRight]} />
              </View>
              <View style={styles.thermalArc}>
                <Ionicons name="sunny-outline" size={22} color="#06B6D4" />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.Text
          style={[styles.wordmark, { opacity: textOpacity, transform: [{ translateY: textY }] }]}
        >
          Build<Text style={styles.wordmarkAccent}>Sense</Text>
        </Animated.Text>

        <Animated.View style={[styles.accentLine, { width: lineWidth }]} />

        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Location-aware thermal insights
        </Animated.Text>

        <Animated.View style={[styles.versionWrap, { opacity: versionOpacity }]}>
          <Text style={styles.version}>v 1.0</Text>
        </Animated.View>

      </Animated.View>
    </>
  );
}

const ICON_SIZE = 100;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C0820',
  },
  glowBlob: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#4F46E510',
    top: height * 0.22,
    alignSelf: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 80,
  },
  glowBlobSecondary: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#06B6D408',
    bottom: height * 0.2,
    right: -40,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 60,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  markContainer: {
    width: ICON_SIZE + 24,
    height: ICON_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: ICON_SIZE + 24,
    height: ICON_SIZE + 24,
    borderRadius: (ICON_SIZE + 24) / 2,
    borderWidth: 1,
    borderColor: '#06B6D420',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#1A1440',
    borderWidth: 1.5,
    borderColor: '#2D2060',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buildingWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    gap: 3,
  },
  tower: {
    width: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  towerLeft:  { height: 32 },
  towerRight: { height: 28 },
  buildingBody: {
    width: 28,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    gap: 3,
    alignContent: 'flex-start',
  },
  windowDot: {
    width: 7,
    height: 7,
    backgroundColor: '#0C0820',
    borderRadius: 1,
  },
  thermalArc: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  wordmark: {
    fontSize: 38,
    fontWeight: '800',
    color: '#F1F0F9',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  wordmarkAccent: { color: '#06B6D4' },
  accentLine: {
    height: 2.5,
    backgroundColor: '#06B6D4',
    borderRadius: 2,
    marginBottom: 14,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#7C7A9A',
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  versionWrap: {
    position: 'absolute',
    bottom: 48,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2060',
    backgroundColor: '#1A1440',
  },
  version: {
    fontSize: 12,
    color: '#4B4870',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
});