import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  ScrollView, Pressable, Switch, Image, ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Button from '@/src/components/common/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { useProjects } from '@/src/hooks/useProjects';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';
import { getAverageScore } from '@/src/utils/helpers';


const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};


// ─── Animated stat number count-up ───────────────────────────────────────────

function AnimatedNumber({ value, style }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration: 900,
      delay: 400,
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(id);
  }, [value]);

  if (typeof value !== 'number') return <Text style={style}>{value}</Text>;
  return <Text style={style}>{display}</Text>;
}

function VerifiedChip() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.verifiedChip}>
      <View style={styles.verifiedIconWrap}>
        {/* Rotating dashed border ring */}
        <Animated.View style={[styles.verifiedRing, { transform: [{ rotate }] }]} />
        {/* Static tick in centre */}
        <Ionicons name="checkmark-circle" size={14} color="#75f1ab" style={styles.verifiedTick} />
      </View>
      <Text style={[styles.verifiedText, { color: '#75f1ab' }]}>Verified Account</Text>
    </View>
  );
}

// ─── SettingRow — unchanged logic, spring press added ────────────────────────

const SettingRow = ({ icon, label, value, onPress, rightEl, colors, active, iconAnim }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => onPress &&
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.settingRow,
        {
          borderBottomColor: colors.border,
          opacity: pressed && onPress ? 0.7 : 1,
          backgroundColor: active ? colors.primary + '10' : 'transparent',
        },
      ]}
    >
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, transform: [{ scale }] }}>
        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
          {/* If iconAnim is provided, wrap the icon in a rotating Animated.View */}
          {iconAnim ? (
            <Animated.View style={{ transform: [{ rotate: iconAnim }] }}>
              <Ionicons name={icon} size={18} color={colors.primary} />
            </Animated.View>
          ) : (
            <Ionicons name={icon} size={18} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        <View style={styles.settingRight}>
          {value && (
            <Text style={[styles.settingValue, { color: colors.textLight }]}>{value}</Text>
          )}
          {rightEl ?? (onPress
            ? <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            : null
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, signOut, isLoading, updateAvatar } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { projects } = useProjects();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [localAvatarUrl, setLocalAvatarUrl] = useState(
    user?.user_metadata?.avatar_url ?? null
  );

  const displayName   = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'User';
  const email         = user?.email ?? '';
  const totalProjects = projects.length;
  const avgScore      = getAverageScore(projects);
  const initials      = getInitials(displayName);
  const avatarUrl     = localAvatarUrl;

  // ── Mount animation refs ──
  const titleAnim    = useRef(new Animated.Value(0)).current;
  const cardAnim     = useRef(new Animated.Value(0)).current;
  const cardScale    = useRef(new Animated.Value(0.95)).current;
  const statsAnim    = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const prefAnim     = useRef(new Animated.Value(0)).current;
  const aboutAnim    = useRef(new Animated.Value(0)).current;
  const logoutAnim   = useRef(new Animated.Value(0)).current;

  // ── Dark mode moon rotation ──
  const moonRot      = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const moonDeg      = moonRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Mount stagger ──
  useEffect(() => {
    Animated.stagger(80, [
      // Title
      Animated.timing(titleAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Identity card
      Animated.parallel([
        Animated.timing(cardAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
      ]),
      // Stats stagger
      ...statsAnim.map(a =>
        Animated.timing(a, { toValue: 1, duration: 340, useNativeDriver: true })
      ),
      // Section labels + cards
      Animated.timing(prefAnim,   { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(aboutAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(logoutAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Moon rotates on dark mode toggle ──
  const handleToggleTheme = () => {
    Animated.timing(moonRot, {
      toValue: isDark ? 0 : 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
    toggleTheme();
  };

  const makeSlide = (anim, offsetY = 16) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) }],
  });


  // ── Image picker — unchanged ──
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings to upload a profile photo.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    setAvatarUploading(true);
    const { url, error } = await updateAvatar(localUri);
    setAvatarUploading(false);

    if (error) {
      Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
    } else if (url) {
      setLocalAvatarUrl(url);
    }
  };


  // ── Logout — unchanged ──
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };


  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page title ── */}
        <Animated.View style={makeSlide(titleAnim, 12)}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Profile
          </Text>
          <LinearGradient
            colors={["#9760d2", "#7ee887"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />
        </Animated.View>

        {/* ── Identity card ── */}
        <Animated.View
          style={[
            makeSlide(cardAnim, 20),
            {
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                { scale: cardScale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#6366F1", "#8B5CF6", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identityCard}
          >
            <View style={styles.decCircle1} />
            <View style={styles.decCircle2} />

            {/* Tappable Avatar — unchanged */}
            <Pressable
              onPress={handlePickAvatar}
              disabled={avatarUploading}
              style={styles.avatarPressable}
            >
              <LinearGradient
                colors={["#9760d2", "#7ee887", "#F5D9B0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  )}
                </View>
              </LinearGradient>
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                {avatarUploading ? (
                  <ActivityIndicator size={10} color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={11} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            <Text style={styles.nameText}>{displayName}</Text>
            <Text style={styles.emailText}>{email}</Text>

            <Pressable onPress={handlePickAvatar} disabled={avatarUploading}>
              <Text style={styles.changePhotoText}>
                {avatarUploading ? "Uploading…" : "Tap avatar to change photo"}
              </Text>
            </Pressable>

            <VerifiedChip />
          </LinearGradient>
        </Animated.View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          {/* Projects */}
          <Animated.View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              makeSlide(statsAnim[0], 20),
            ]}
          >
            <View
              style={[styles.statTopBar, { backgroundColor: colors.primary }]}
            />
            <AnimatedNumber
              value={totalProjects}
              style={[styles.statValue, { color: colors.primary }]}
            />
            <Text style={[styles.statLabel, { color: colors.textLight }]}>
              Projects
            </Text>
          </Animated.View>

          {/* Avg Score */}
          <Animated.View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              makeSlide(statsAnim[1], 20),
            ]}
          >
            <View
              style={[styles.statTopBar, { backgroundColor: colors.success }]}
            />
            <AnimatedNumber
              value={totalProjects > 0 ? avgScore : null}
              style={[
                styles.statValue,
                {
                  color: totalProjects > 0 ? colors.success : colors.textLight,
                },
              ]}
            />
            {totalProjects === 0 && (
              <Text style={[styles.statValue, { color: colors.textLight }]}>
                —
              </Text>
            )}
            <Text style={[styles.statLabel, { color: colors.textLight }]}>
              Avg Score
            </Text>
          </Animated.View>

          {/* Synced */}
          <Animated.View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              makeSlide(statsAnim[2], 20),
            ]}
          >
            <View
              style={[styles.statTopBar, { backgroundColor: colors.secondary }]}
            />
            <Ionicons
              name="cloud-done-outline"
              size={22}
              color={colors.secondary}
            />
            <Text style={[styles.statLabel, { color: colors.textLight }]}>
              Synced
            </Text>
          </Animated.View>
        </View>

        {/* ── Preferences ── */}
        <Animated.View style={makeSlide(prefAnim, 14)}>
          <View style={styles.sectionLabelRow}>
            <View
              style={[
                styles.sectionAccent,
                { backgroundColor: colors.primary },
              ]}
            />
            <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
              PREFERENCES
            </Text>
          </View>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <SettingRow
  icon="moon-outline"
  label="Dark Mode"
  colors={colors}
  active={isDark}
  iconAnim={moonDeg}
  rightEl={
    <Switch
      value={isDark}
      onValueChange={handleToggleTheme}
      trackColor={{ false: colors.border, true: colors.primary + '80' }}
      thumbColor={isDark ? colors.primary : colors.textLight}
    />
  }
/>
            <SettingRow
              icon="compass-outline"
              label="Climate Explorer"
              colors={colors}
              onPress={() => router.push("/(tabs)/explore")}
            />
          </View>
        </Animated.View>

        {/* ── About ── */}
        <Animated.View style={makeSlide(aboutAnim, 14)}>
          <View style={styles.sectionLabelRow}>
            <View
              style={[
                styles.sectionAccent,
                { backgroundColor: colors.secondary },
              ]}
            />
            <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
              ABOUT
            </Text>
          </View>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <SettingRow
              icon="information-circle-outline"
              label="What this app does"
              colors={colors}
              rightEl={null}
            />
            <View style={styles.aboutContent}>
              {[
                "Rapid passive thermal analysis for early-stage design decisions.",
                "Estimates thermal comfort using local climate data + building inputs.",
                "Helps visualise impact of orientation, WWR, and envelope choices.",
              ].map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <LinearGradient
                    colors={["#9760d2", "#7ee887"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bullet}
                  />
                  <Text
                    style={[styles.bulletText, { color: colors.textLight }]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            <SettingRow
              icon="shield-checkmark-outline"
              label="Data & Privacy"
              colors={colors}
              rightEl={null}
            />
            <Text style={[styles.privacyText, { color: colors.textLight }]}>
              All project data is securely stored on Supabase. We do not sell
              your data. Climate data is fetched live from OpenWeatherMap API.
            </Text>
          </View>
        </Animated.View>

        {/* ── Version ── */}
        <Animated.View style={[styles.versionRow, makeSlide(logoutAnim, 10)]}>
          <Ionicons name="apps-outline" size={16} color={colors.textLight} />
          <Text style={[styles.versionText, { color: colors.textLight }]}>
            BuildSense v1.0
          </Text>
        </Animated.View>

        {/* ── Logout ── */}
        <Animated.View style={makeSlide(logoutAnim, 10)}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="danger"
            isLoading={isLoading}
            style={styles.logoutBtn}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl + 16 },

  pageTitle: { ...TYPOGRAPHY.h2, fontWeight: '800', marginBottom: SPACING.xs },
  titleUnderline: { height: 2, borderRadius: 1, marginBottom: SPACING.lg, width: '24%' },

  identityCard: {
    borderRadius: 20, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.md,
    overflow: 'hidden', paddingVertical: SPACING.xl,
  },
  decCircle1: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, backgroundColor: '#FFFFFF08',
    top: -40, right: -30,
  },
  decCircle2: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, backgroundColor: '#FFFFFF08',
    bottom: -20, left: -20,
  },

  avatarPressable: { marginBottom: SPACING.md },
  avatarRing: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    padding: 2.5,
  },
  avatarInner: {
    flex: 1, width: '100%', borderRadius: 20,
    backgroundColor: '#1E1040',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage:    { width: '100%', height: '100%', borderRadius: 20 },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },

  cameraBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },

  nameText:        { ...TYPOGRAPHY.h3, color: '#FFFFFF', fontWeight: '700' },
  emailText:       { ...TYPOGRAPHY.bodySmall, color: '#FFFFFFB0', marginTop: 4 },
  changePhotoText: { ...TYPOGRAPHY.caption, color: '#FFFFFFA0', marginTop: 6, marginBottom: 2 },

  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF20', borderRadius: 20,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    marginTop: SPACING.sm,
  },
  verifiedText: { ...TYPOGRAPHY.caption, fontWeight: '600' },

  verifiedIconWrap: {
  width: 18, height: 18,
  alignItems: 'center', justifyContent: 'center',
},
verifiedRing: {
  position: 'absolute',
  width: 18, height: 18, borderRadius: 9,
  borderWidth: 1.5,
  borderColor: '#75f1ab',
  borderStyle: 'dashed',
},
verifiedTick: {
  position: 'absolute',
},

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', overflow: 'hidden',
    paddingBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statTopBar: { width: '100%', height: 3, marginBottom: SPACING.sm },
  statValue:  { ...TYPOGRAPHY.h2, fontWeight: '800' },
  statLabel:  { ...TYPOGRAPHY.caption },

  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.xs, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: 2 },
  sectionLabel:  { ...TYPOGRAPHY.caption, fontWeight: '700', letterSpacing: 1 },

  settingsCard: {
    borderRadius: 14, borderWidth: 1.5,
    overflow: 'hidden', marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderBottomWidth: 1,
  },
  settingIcon: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingLabel:  { ...TYPOGRAPHY.body, flex: 1 },
  settingRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue:  { ...TYPOGRAPHY.bodySmall },

  aboutContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  bulletRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: SPACING.sm, marginBottom: SPACING.xs,
  },
  bullet:     { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletText: { ...TYPOGRAPHY.bodySmall, flex: 1, lineHeight: 20 },

  privacyText: {
    ...TYPOGRAPHY.bodySmall, lineHeight: 20,
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
  },

  versionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  versionText: { ...TYPOGRAPHY.caption },
  logoutBtn:   { marginBottom: SPACING.sm },
});